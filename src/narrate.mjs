import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "./paths.mjs";
import { loadScript } from "./script.mjs";
import { synthesize } from "./tts.mjs";
import { duration, ffmpeg } from "./audio.mjs";
import { rendererConfig } from "./config.mjs";

const silenceName = (value) => `s-${String(value).replace(".", "_")}.wav`;

export async function narrate(config, project, { force = false, log = console.log } = {}) {
  const script = loadScript(project);
  const build = ensureDir(project.build);
  const voiceDir = ensureDir(path.join(build, "voice"));
  const cacheDir = ensureDir(path.join(project.cache, "voice"));
  const gaps = config.voice;

  let voice = config.voice.name;
  let fallback = false;
  const sentences = [];
  const segments = [];
  let index = 0;
  let cursor = gaps.initialSilence;

  const voiceFor = (name) => ({ ...gaps, name });

  for (const [s, seg] of script.segments.entries()) {
    const segStart = cursor;
    const built = { id: seg.id, title: seg.title, start: segStart, end: 0, sentences: [] };
    for (const [i, text] of seg.sentences.entries()) {
      const wav = path.join(voiceDir, `s-${String(index).padStart(3, "0")}.wav`);
      let result;
      try {
        result = await synthesize({
          voice: voiceFor(voice),
          text,
          cacheDir,
          log: (m) => log(`  ${m}`),
        });
      } catch (error) {
        if (fallback) throw error;
        fallback = true;
        voice = gaps.fallback;
        log(`  primary voice failed (${error.message}); falling back to ${voice}`);
        result = await synthesize({
          voice: voiceFor(voice),
          text,
          cacheDir,
          log: (m) => log(`  ${m}`),
        });
      }
      if (force || !fs.existsSync(wav)) {
        ffmpeg(["-v", "error", "-i", result.file, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
      }
      const dur = duration(wav);
      const sent = {
        index,
        text,
        file: path.relative(project.root, wav),
        start: cursor,
        duration: dur,
        end: cursor + dur,
        segment: seg.id,
        cached: result.cached,
      };
      sentences.push(sent);
      built.sentences.push(sent);
      cursor += dur;
      if (i < seg.sentences.length - 1) cursor += gaps.sentenceGap;
      index++;
      log(`  ${String(index).padStart(2, "0")}/${script.segments.reduce((n, x) => n + x.sentences.length, 0)} ${dur.toFixed(2)}s ${result.cached ? "cached" : "new"}  ${text.slice(0, 54)}`);
    }
    built.end = cursor;
    segments.push(built);
    cursor += gaps.segmentGap;
  }

  const planned = cursor + gaps.tailSilence;
  const silences = ensureDir(path.join(build, "silence"));
  const silenceValues = new Set([
    gaps.initialSilence,
    gaps.sentenceGap,
    gaps.segmentGap,
    gaps.tailSilence,
  ]);
  for (const value of silenceValues) {
    const file = path.join(silences, silenceName(value));
    if (!fs.existsSync(file)) {
      ffmpeg(["-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", String(value), "-c:a", "pcm_s16le", file]);
    }
  }
  const silence = (value) => path.join(silences, silenceName(value));

  const list = [silence(gaps.initialSilence)];
  for (const [s, seg] of segments.entries()) {
    for (const [i, sent] of seg.sentences.entries()) {
      list.push(path.join(project.root, sent.file));
      const last = i === seg.sentences.length - 1;
      if (!last) list.push(silence(gaps.sentenceGap));
      else if (s < segments.length - 1) list.push(silence(gaps.segmentGap));
    }
  }
  list.push(silence(gaps.tailSilence));

  const listFile = path.join(build, "concat.txt");
  fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  const raw = path.join(build, "narration-raw.wav");
  ffmpeg(["-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "pcm_s16le", raw]);

  const narration = path.join(build, "narration.wav");
  ffmpeg(["-v", "error", "-i", raw, "-af", gaps.chain, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", narration]);
  const audioDuration = duration(narration);

  const timeline = {
    title: script.title ?? config.title,
    hash: script.hash,
    voice: voice,
    voiceFallback: fallback,
    initialSilence: gaps.initialSilence,
    sentenceGap: gaps.sentenceGap,
    segmentGap: gaps.segmentGap,
    tailSilence: gaps.tailSilence,
    plannedDuration: Number(planned.toFixed(3)),
    duration: Number(audioDuration.toFixed(3)),
    totalSpeech: Number(sentences.reduce((n, s) => n + s.duration, 0).toFixed(3)),
    segments,
    sentences,
  };
  fs.writeFileSync(path.join(build, "timeline.json"), JSON.stringify(timeline, null, 2));
  fs.writeFileSync(path.join(build, "render.json"), JSON.stringify(rendererConfig(config), null, 2));

  const target = config.targetSeconds ?? null;
  log(
    `\n${sentences.length} sentences, ${timeline.totalSpeech.toFixed(1)}s speech, ` +
      `${timeline.duration.toFixed(1)}s film${target ? ` (target ${target}s)` : ""}`,
  );
  if (fallback) log(`warning: fell back to ${voice}`);
  return timeline;
}
