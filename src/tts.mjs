import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { OUTPUT_FORMAT } from "msedge-tts";

export function cacheKey(parts) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

function formatFor(name) {
  const key = String(name).toUpperCase().replace(/-/g, "_");
  const value = OUTPUT_FORMAT[key];
  if (!value) {
    throw new Error(
      `Unknown voice format "${name}". Use an OUTPUT_FORMAT name such as AUDIO_24KHZ_48KBITRATE_MONO_MP3.`,
    );
  }
  return value;
}

export function voiceKey(voice, text) {
  return cacheKey({
    engine: voice.engine,
    name: voice.name,
    rate: voice.rate,
    pitch: voice.pitch,
    format: voice.format,
    text,
  });
}

async function fetchOne(tts, text, file, voice) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { audioStream } = tts.toStream(text, { rate: voice.rate, pitch: voice.pitch });
      const chunks = [];
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), 30000);
        const done = () => {
          clearTimeout(timer);
          resolve();
        };
        audioStream.on("data", (d) => chunks.push(d));
        audioStream.on("end", done);
        audioStream.on("close", done);
        audioStream.on("error", reject);
      });
      const buf = Buffer.concat(chunks);
      if (buf.length < 1000) throw new Error("too small");
      fs.writeFileSync(file, buf);
      return;
    } catch (e) {
      if (attempt === 4) throw e;
      process.stderr.write(`\n  tts retry ${attempt + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }
  }
}

export async function synthesize({ voice, text, cacheDir, log = () => {} }) {
  const key = voiceKey(voice, text);
  const file = path.join(cacheDir, `${key}.mp3`);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
    log(`cache ${key}`);
    return { file, cached: true, key, voice: voice.name };
  }
  const { MsEdgeTTS } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice.name, formatFor(voice.format));
  await fetchOne(tts, text, file, voice);
  fs.writeFileSync(path.join(cacheDir, `${key}.txt`), `${voice.name}\n${text}\n`);
  log(`tts   ${key}`);
  return { file, cached: false, key, voice: voice.name };
}
