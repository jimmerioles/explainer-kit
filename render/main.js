import {
  W,
  H,
  canvas,
  ctx,
  C,
  F,
  smooth,
  span,
  loadAssets,
  loadTimeline,
  buildScenes,
  drawBackground,
  chrome,
  applyTheme,
} from "./helpers.js";

import { SCENES } from "/project/scenes.js";
import { ASSETS } from "/project/assets.js";

let timeline = null;
let scenes = null;
let duration = 0;
let settings = null;

function activeAt(t) {
  const out = [];
  for (const sc of scenes) {
    if (t < sc.start - 0.55 || t > sc.end + 0.55) continue;
    let alpha = 1;
    if (sc.start > 0) alpha *= smooth(span(t, sc.start - 0.55, sc.start + 0.25));
    if (sc.end < duration) alpha *= 1 - smooth(span(t, sc.end - 0.25, sc.end + 0.55));
    if (alpha <= 0.002) continue;
    out.push({ sc, alpha, lt: t - sc.start });
  }
  return out;
}

export function renderFrame(t) {
  drawBackground(t, 1);
  const active = activeAt(t);
  for (const { sc, alpha, lt } of active) {
    const fn = SCENES[sc.id] ?? SCENES.__default;
    if (!fn) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    fn(lt, sc);
    ctx.restore();
  }

  // persistent chrome
  let chromeP = smooth(span(t, 12, 14));
  chromeP *= 1 - 0.72 * smooth(span(t, duration - 9, duration - 5));
  if (chromeP > 0) {
    const visible = active.filter((a) => a.alpha > 0.25);
    const sc = visible.length ? visible[visible.length - 1].sc : scenes[Math.max(0, Math.floor(t / 1))];
    chrome(sc, chromeP);
  }

  // fades
  const fadeIn = 1 - smooth(span(t, 0, 1.4));
  const fadeOut = smooth(span(t, duration - 1.1, duration));
  const fade = Math.max(fadeIn, fadeOut);
  if (fade > 0) {
    ctx.fillStyle = `rgba(3,5,12,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

async function boot() {
  settings = await fetch("/build/render.json").then((r) => {
    if (!r.ok) throw new Error(`render.json: ${r.status}`);
    return r.json();
  });
  applyTheme(settings.theme);

  const [tl] = await Promise.all([
    loadTimeline("/build/timeline.json"),
    loadAssets(ASSETS),
    Promise.all([
      document.fonts.load('400 32px "Space Grotesk"'),
      document.fonts.load('500 80px "Space Grotesk"'),
      document.fonts.load('600 46px "Space Grotesk"'),
      document.fonts.load('700 46px "Space Grotesk"'),
      document.fonts.load('400 18px "JetBrains Mono"'),
      document.fonts.load('500 18px "JetBrains Mono"'),
      document.fonts.load('italic 400 92px "Instrument Serif"'),
    ]).then(() => document.fonts.ready),
  ]);
  timeline = tl;
  duration = tl.duration;
  scenes = buildScenes(tl);
  renderFrame(0);
  window.__meta = { duration, frames: Math.ceil(duration * settings.fps), timeline, settings };
  window.__ready = true;
  console.log("ready", duration.toFixed(2), "seconds");
}

window.renderFrame = renderFrame;
window.startEncode = async ({ fps = 30, bitrate = 14_000_000, limit = null, name = "film.webm" } = {}) => {
  if (settings && (fps !== settings.fps || canvas.width !== settings.width || canvas.height !== settings.height)) {
    throw new Error(
      `Encode settings ${fps}fps ${canvas.width}x${canvas.height} do not match render.json ` +
        `${settings.fps}fps ${settings.width}x${settings.height}`,
    );
  }
  const { Muxer, ArrayBufferTarget } = await import("/kit/render/webm-muxer.mjs");
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "V_VP9", width: canvas.width, height: canvas.height, frameRate: fps },
    firstTimestampBehavior: "offset",
  });
  let encodeError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = String(e);
    },
  });
  encoder.configure({
    codec: "vp09.00.10.08",
    width: canvas.width,
    height: canvas.height,
    bitrate,
    framerate: fps,
    latencyMode: "quality",
  });

  const seconds = limit ? Math.min(limit, duration) : duration;
  const total = Math.ceil(seconds * fps);
  const started = performance.now();
  for (let i = 0; i < total; i++) {
    renderFrame(i / fps);
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round((i * 1e6) / fps),
      duration: Math.round(1e6 / fps),
    });
    encoder.encode(frame, { keyFrame: i % 60 === 0 });
    frame.close();
    if (i % 20 === 0) await new Promise((r) => setTimeout(r, 0));
    while (encoder.encodeQueueSize > 24) await new Promise((r) => setTimeout(r, 3));
    if (i % 150 === 0) {
      const pct = ((i / total) * 100).toFixed(1);
      console.log(`frame ${i}/${total} ${pct}% ${((performance.now() - started) / 1000).toFixed(1)}s`);
    }
    if (encodeError) throw new Error(encodeError);
  }
  await encoder.flush();
  encoder.close();
  muxer.finalize();
  const blob = new Blob([target.buffer], { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`done ${(blob.size / 1e6).toFixed(1)}MB in ${((performance.now() - started) / 1000).toFixed(1)}s`);
  return { size: blob.size, seconds: (performance.now() - started) / 1000 };
};

window.addEventListener("error", (e) => console.error("page error", e.message));
boot().catch((e) => {
  console.error("boot failed", e.message);
  window.__error = String(e.message ?? e);
});
