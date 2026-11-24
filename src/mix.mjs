import fs from "node:fs";
import path from "node:path";
import { duration, ffmpeg, loudness, measureLoudnorm } from "./audio.mjs";
import { ensureDir } from "./paths.mjs";
import { inspectBed } from "./bed.mjs";

function escapeFilterValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/:/g, "\\:");
}

export function mixAudio(config, project, { log = console.log } = {}) {
  const build = ensureDir(project.build);
  const narration = path.join(build, "narration.wav");
  if (!fs.existsSync(narration)) throw new Error("No narration.wav. Run `explainer narrate` first.");
  const seconds = duration(narration);
  const bedInfo = inspectBed(config, project, { filmSeconds: seconds });
  if (bedInfo.missing) throw new Error(`Missing music bed: ${bedInfo.file}`);
  if (bedInfo.tooShort) {
    throw new Error(
      `Music bed is ${bedInfo.seconds.toFixed(2)}s but the narration is ${seconds.toFixed(2)}s. ` +
        "Extend the bed or trim the film; the kit will not pad it with silence.",
    );
  }
  const bed = bedInfo.file;
  if (bedInfo.configured) {
    log(
      `bed ${bedInfo.name} ${bedInfo.seconds.toFixed(2)}s, ` +
        `${bedInfo.loudness.integrated} LUFS, ${bedInfo.loudness.truePeak} dBFS`,
    );
    if (!bedInfo.levelOk || !bedInfo.peakOk) log(`warning: ${bedInfo.reason}`);
  }

  const pre = path.join(build, "mix-pre.wav");
  const sr = config.mix.master.sampleRate;

  if (bed) {
    const fade = Math.min(config.mix.fadeOut, seconds / 3);
    const duck = config.mix.duck;
    const graph = [
      `[1:a]aformat=sample_rates=${sr}:channel_layouts=stereo,` +
        `volume=${escapeFilterValue(config.mix.bedGainDb)}dB,` +
        `atrim=0:${seconds},apad=whole_dur=${seconds},` +
        `afade=t=out:st=${(seconds - fade).toFixed(3)}:d=${fade.toFixed(3)}[bed]`,
      `[0:a]aformat=sample_rates=${sr}:channel_layouts=stereo[narr]`,
      `[bed][narr]sidechaincompress=threshold=${duck.threshold}:ratio=${duck.ratio}:` +
        `attack=${duck.attack}:release=${duck.release}[duck]`,
      `[narr][duck]amix=inputs=2:duration=first:normalize=0[out]`,
    ].join(";");
    ffmpeg([
      "-v", "error",
      "-i", narration,
      "-i", bed,
      "-filter_complex", graph,
      "-map", "[out]",
      "-ar", String(sr), "-ac", "2", "-c:a", "pcm_s16le",
      pre,
    ]);
    log(`mixed narration with ${path.relative(project.root, bed)}`);
  } else {
    ffmpeg([
      "-v", "error",
      "-i", narration,
      "-af", `aformat=sample_rates=${sr}:channel_layouts=stereo`,
      "-ar", String(sr), "-ac", "2", "-c:a", "pcm_s16le",
      pre,
    ]);
    log("mixed narration only (no bed configured)");
  }

  const master = config.mix.master;
  const measured = measureLoudnorm(pre);
  const loudnorm =
    `loudnorm=I=${master.lufs}:TP=${master.truePeak}:LRA=${master.lra}` +
    `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
    `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
    `:offset=${measured.target_offset}:linear=true`;
  const out = path.join(build, "mix.wav");
  try {
    ffmpeg(["-v", "error", "-i", pre, "-af", loudnorm, "-ar", String(sr), "-ac", "2", "-c:a", "pcm_s16le", out]);
  } catch (error) {
    log("two-pass normalize failed, falling back to single pass");
    ffmpeg([
      "-v", "error", "-i", pre,
      "-af", `loudnorm=I=${master.lufs}:TP=${master.truePeak}:LRA=${master.lra}`,
      "-ar", String(sr), "-ac", "2", "-c:a", "pcm_s16le", out,
    ]);
  }
  const measuredOut = loudness(out);
  log(
    `mix ${measuredOut.integrated} LUFS, true peak ${measuredOut.truePeak} dBFS, ` +
      `${duration(out).toFixed(2)}s`,
  );
  return { file: out, loudness: measuredOut, seconds: duration(out) };
}

export function chaptersFor(project, timeline) {
  const chapters = timeline.segments.map((seg, i) => ({
    start: i === 0 ? 0 : seg.start,
    end: i === timeline.segments.length - 1 ? timeline.duration : timeline.segments[i + 1].start,
    title: seg.title ?? seg.id,
  }));
  const lines = [";FFMETADATA1"];
  for (const ch of chapters) {
    lines.push(
      "[CHAPTER]",
      "TIMEBASE=1/1000",
      `START=${Math.round(ch.start * 1000)}`,
      `END=${Math.round(ch.end * 1000)}`,
      `title=${ch.title.replace(/([=;#\\])/g, "\\$1")}`,
    );
  }
  const file = path.join(project.build, "chapters.txt");
  fs.writeFileSync(file, lines.join("\n") + "\n");
  return { file, chapters };
}
