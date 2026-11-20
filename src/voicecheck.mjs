import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT } from "./paths.mjs";
import { synthesize } from "./tts.mjs";
import { duration, loudness } from "./audio.mjs";

const TEXT = "The page isn't illustrating sound. It's listening to it.";
const GOLDEN = path.join(KIT_ROOT, "golden", "voice.json");

export async function voicecheck(config, { update = false, log = console.log } = {}) {
  const voice = config.voice;
  const dir = path.join(KIT_ROOT, "golden");
  fs.mkdirSync(dir, { recursive: true });
  const cacheDir = path.join(dir, "cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const result = await synthesize({ voice: { ...voice, name: voice.name }, text: TEXT, cacheDir, log });
  const seconds = duration(result.file);
  const level = loudness(result.file);
  const sample = { text: TEXT, voice: voice.name, rate: voice.rate, pitch: voice.pitch, seconds, lufs: level.integrated };

  if (update || !fs.existsSync(GOLDEN)) {
    fs.copyFileSync(result.file, path.join(dir, "voice.mp3"));
    fs.writeFileSync(GOLDEN, JSON.stringify(sample, null, 2) + "\n");
    log(`golden voice written: ${seconds.toFixed(2)}s, ${level.integrated} LUFS`);
    return { ok: true, sample, updated: true };
  }

  const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
  const drift = Math.abs(seconds - golden.seconds) / golden.seconds;
  const loud = Math.abs(level.integrated - golden.lufs);
  const ok = drift <= 0.08 && loud <= 1.5;
  log(
    `${ok ? "ok  " : "DRIFT"} voice ${voice.name}  ` +
      `${seconds.toFixed(2)}s vs ${golden.seconds.toFixed(2)}s, ` +
      `${level.integrated} vs ${golden.lufs} LUFS`,
  );
  if (!ok) process.exitCode = 1;
  return { ok, sample, golden };
}
