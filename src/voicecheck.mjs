import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT } from "./paths.mjs";
import { resolveEngine } from "./voices.mjs";
import { synthesize } from "./tts.mjs";
import { duration, loudness } from "./audio.mjs";

const TEXT = "The page isn't illustrating sound. It's listening to it.";

function goldenPaths(engine, name) {
  const slug = `${engine}-${name}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const dir = path.join(KIT_ROOT, "golden", "voices");
  fs.mkdirSync(dir, { recursive: true });
  const ext = engine === "kokoro" ? "wav" : "mp3";
  return {
    dir,
    golden: path.join(dir, `${slug}.json`),
    audio: path.join(dir, `${slug}.${ext}`),
  };
}

export async function voicecheck(config, { update = false, log = console.log } = {}) {
  const voice = config.voice;
  const engine = resolveEngine(voice);
  const paths = goldenPaths(engine, voice.name);
  const cacheDir = path.join(KIT_ROOT, "golden", "cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const result = await synthesize({
    voice: { ...voice, engine },
    text: TEXT,
    cacheDir,
    log,
  });
  const seconds = duration(result.file);
  const level = loudness(result.file);
  const sample = {
    text: TEXT,
    engine,
    voice: voice.name,
    seconds,
    lufs: level.integrated,
  };
  if (engine === "kokoro") sample.speed = voice.speed ?? 0.88;
  if (engine === "edge") {
    sample.rate = voice.rate ?? null;
    sample.pitch = voice.pitch ?? null;
  }

  if (update || !fs.existsSync(paths.golden)) {
    fs.copyFileSync(result.file, paths.audio);
    fs.writeFileSync(paths.golden, JSON.stringify(sample, null, 2) + "\n");
    log(`golden voice written: ${engine} ${voice.name}, ${seconds.toFixed(2)}s, ${level.integrated} LUFS`);
    return { ok: true, sample, updated: true, golden: paths.golden };
  }

  const golden = JSON.parse(fs.readFileSync(paths.golden, "utf8"));
  const drift = Math.abs(seconds - golden.seconds) / golden.seconds;
  const loud = Math.abs(level.integrated - golden.lufs);
  const ok = drift <= 0.08 && loud <= 1.5;
  log(
    `${ok ? "ok  " : "DRIFT"} voice ${engine} ${voice.name}  ` +
      `${seconds.toFixed(2)}s vs ${golden.seconds.toFixed(2)}s, ` +
      `${level.integrated} vs ${golden.lufs} LUFS`,
  );
  if (!ok) process.exitCode = 1;
  return { ok, sample, golden };
}
