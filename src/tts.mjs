import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { OUTPUT_FORMAT } from "msedge-tts";
import { resolveEngine } from "./voices.mjs";

const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const DEFAULT_KOKORO_SPEED = 0.88;

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
  const engine = resolveEngine(voice);
  if (engine === "kokoro") {
    return cacheKey({
      engine,
      model: KOKORO_MODEL,
      name: voice.name,
      speed: Number(voice.speed ?? DEFAULT_KOKORO_SPEED),
      sampleRate: Number(voice.sampleRate ?? 24000),
      text,
    });
  }
  return cacheKey({
    engine,
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

async function synthesizeEdge({ voice, text, cacheDir, log }) {
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
  fs.writeFileSync(
    path.join(cacheDir, `${key}.txt`),
    `${voice.engine}\n${voice.name}\n${voice.rate}\n${voice.pitch}\n${text}\n`,
  );
  log(`tts   ${key}`);
  return { file, cached: false, key, voice: voice.name };
}

let kokoroPromise = null;
let kokoroLogged = false;

async function getKokoro(log) {
  if (!kokoroPromise) {
    if (!kokoroLogged) {
      log("kokoro load (first run downloads about 300 MB)");
      kokoroLogged = true;
    }
    kokoroPromise = import("kokoro-js")
      .then(({ KokoroTTS }) =>
        KokoroTTS.from_pretrained(KOKORO_MODEL, {
          dtype: "q8",
          device: "cpu",
        }),
      )
      .catch((error) => {
        kokoroPromise = null;
        throw new Error(`Kokoro engine failed to load: ${error.message}`);
      });
  }
  return kokoroPromise;
}

async function synthesizeKokoro({ voice, text, cacheDir, log }) {
  const key = voiceKey(voice, text);
  const file = path.join(cacheDir, `${key}.wav`);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
    log(`cache ${key}`);
    return { file, cached: true, key, voice: voice.name };
  }
  const tts = await getKokoro(log);
  const speed = Number(voice.speed ?? DEFAULT_KOKORO_SPEED);
  const audio = await tts.generate(text, {
    voice: voice.name,
    speed,
  });
  await audio.save(file);
  fs.writeFileSync(
    path.join(cacheDir, `${key}.txt`),
    `${voice.engine}\n${voice.name}\n${speed}\n${KOKORO_MODEL}\n${text}\n`,
  );
  log(`tts   ${key}`);
  return { file, cached: false, key, voice: voice.name };
}

export async function synthesize({ voice, text, cacheDir, log = () => {} }) {
  const engine = resolveEngine(voice);
  const resolved = { ...voice, engine };
  if (engine === "kokoro") {
    return synthesizeKokoro({ voice: resolved, text, cacheDir, log });
  }
  return synthesizeEdge({ voice: resolved, text, cacheDir, log });
}
