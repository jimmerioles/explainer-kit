export const W = 1920;
export const H = 1080;

export const canvas = document.getElementById("stage");
export const ctx = canvas.getContext("2d", { alpha: false });

export const C = {
  bg: "#070a15",
  bg2: "#0a0e1d",
  ink: "#f4f1ea",
  dim: "rgba(244,241,234,0.58)",
  faint: "rgba(244,241,234,0.32)",
  line: "rgba(244,241,234,0.13)",
  coral: "#ff6a4d",
  peach: "#ffc27a",
  mint: "#6df3cd",
  cyan: "#59d8ef",
  violet: "#8e9bff",
  panel: "rgba(11,15,30,0.72)",
};

export const F = {
  sans: "Space Grotesk",
  serif: "Instrument Serif",
  mono: "JetBrains Mono",
};

export const IMG = {};

export const M = { x: 110, top: 80, bottom: 42 };

let CHROME = { left: "WAVE", center: "", right: "" };

export function setChrome(chrome = {}) {
  CHROME = {
    left: chrome.left ?? "",
    center: chrome.center ?? "",
    right: chrome.right ?? "",
  };
}

export function applyTheme(theme = {}) {
  if (theme.colors) Object.assign(C, theme.colors);
  if (theme.accent) C.coral = theme.accent;
  if (theme.fonts) Object.assign(F, theme.fonts);
  if (theme.margins) Object.assign(M, theme.margins);
  if (theme.chrome) setChrome(theme.chrome);
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => (b === a ? 0 : clamp((x - a) / (b - a), 0, 1));
export const smooth = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeIn = (t) => Math.pow(clamp(t, 0, 1), 3);
export const easeInOut = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const span = (t, a, b) => inv(a, b, t);
export const pulse = (t, period, phase = 0) => 0.5 + 0.5 * Math.sin((t / period + phase) * Math.PI * 2);

export function withAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function font(size, weight = 500, family = F.sans, style = "normal") {
  ctx.font = `${style} ${weight} ${size}px "${family}"`;
}

export function text(str, x, y, opts = {}) {
  const {
    size = 32,
    weight = 500,
    family = F.sans,
    style = "normal",
    color = C.ink,
    alpha = 1,
    align = "left",
    baseline = "alphabetic",
    ls = 0,
    maxWidth,
  } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  font(size, weight, family, style);
  ctx.letterSpacing = `${ls}px`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (maxWidth) ctx.fillText(str, x, y, maxWidth);
  else ctx.fillText(str, x, y);
  ctx.restore();
}

export function label(str, x, y, opts = {}) {
  text(str.toUpperCase(), x, y, {
    size: 18,
    weight: 400,
    family: F.mono,
    color: C.dim,
    ls: 3.2,
    ...opts,
  });
}

export function wrap(str, maxWidth, size, weight = 400, family = F.sans) {
  font(size, weight, family);
  const words = str.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function paragraph(str, x, y, maxWidth, opts = {}) {
  const {
    size = 32,
    weight = 400,
    family = F.sans,
    color = C.dim,
    lineHeight = size * 1.45,
    alpha = 1,
    align = "left",
  } = opts;
  const lines = wrap(str, maxWidth, size, weight, family);
  lines.forEach((line, i) => {
    text(line, x, y + i * lineHeight, { size, weight, family, color, alpha, align });
  });
  return lines.length;
}

export function revealText(str, x, y, p, opts = {}) {
  const { size = 80, weight = 500, family = F.sans, style = "normal", color = C.ink, alpha = 1, align = "left", ls = 0 } = opts;
  const prog = clamp(p, 0, 1);
  if (prog <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  font(size, weight, family, style);
  ctx.letterSpacing = `${ls}px`;
  const width = ctx.measureText(str).width;
  let left = x;
  if (align === "center") left = x - width / 2;
  else if (align === "right") left = x - width;
  ctx.beginPath();
  ctx.rect(left - 8, y - size * 1.15, (width + 16) * prog, size * 1.6);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function panel(x, y, w, h, opts = {}) {
  const {
    r = 18,
    fill = "rgba(10,14,28,0.66)",
    stroke = "rgba(244,241,234,0.10)",
    lw = 1.4,
    alpha = 1,
    glow = null,
  } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 40;
  }
  rrect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.restore();
}

export function line(x1, y1, x2, y2, color = C.line, lw = 1, dash = null, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function curve(pts, color = C.coral, lw = 2, alpha = 1, dash = null) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

export function arrow(x1, y1, x2, y2, color = C.faint, lw = 1.6, head = 9, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.42) * head, y2 - Math.sin(a - 0.42) * head);
  ctx.lineTo(x2 - Math.cos(a + 0.42) * head, y2 - Math.sin(a + 0.42) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function dot(x, y, r, color = C.coral, alpha = 1, glow = 0) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function ring(x, y, r, color = C.line, lw = 1, alpha = 1, dash = null) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function glow(x, y, r, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(color, alpha));
  g.addColorStop(0.45, withAlpha(color, alpha * 0.4));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function image(name, x, y, w, h, alpha = 1, r = 18, zoom = 1) {
  const img = IMG[name];
  if (!img) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  rrect(x, y, w, h, r);
  ctx.clip();
  const dh = h * zoom;
  const dw = w * zoom;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function imageCrop(name, sx, sy, sw, sh, dx, dy, dw, dh, alpha = 1, r = 18) {
  const img = IMG[name];
  if (!img) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  rrect(dx, dy, dw, dh, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

export function drawSaw(x, y, w, h, phase, color, lw = 2.5, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  const cycles = 3;
  for (let i = 0; i <= w; i++) {
    const p = i / w;
    const v = ((p * cycles + phase) % 1) * 2 - 1;
    const px = x + i;
    const py = y + h / 2 - v * h * 0.34;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawTriangle(x, y, w, h, phase, color, lw = 2.5, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  const cycles = 3;
  for (let i = 0; i <= w; i++) {
    const p = i / w;
    const v = 1 - 4 * Math.abs(((p * cycles + phase) % 1) - 0.5);
    const px = x + i;
    const py = y + h / 2 - v * h * 0.34;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSine(x, y, w, h, phase, color, lw = 2.5, alpha = 1, cycles = 3) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i <= w; i++) {
    const p = i / w;
    const v = Math.sin((p * cycles + phase) * Math.PI * 2);
    const px = x + i;
    const py = y + h / 2 - v * h * 0.34;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function noiseAt(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

export function drawWaveforms(x, y, w, h, t, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w < 200 ? 1.4 : 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  const samples = Math.max(90, Math.min(420, Math.floor(w / 3)));
  const cycles = Math.max(4, Math.min(90, w / 21));
  for (let i = 0; i <= samples; i++) {
    const p = i / samples;
    const px = x + p * w;
    const env = 0.55 + 0.45 * Math.sin(p * Math.PI);
    const v =
      Math.sin((p * cycles + t * 3.1) * Math.PI * 2) * 0.48 +
      Math.sin((p * cycles * 1.63 - t * 2.2) * Math.PI * 2) * 0.22 +
      Math.sin((p * cycles * 2.71 + t * 1.4) * Math.PI * 2) * 0.12 +
      noiseAt(i * 0.73 + Math.floor(t * 24)) * 0.14;
    const py = y + h / 2 - v * h * 0.4 * env;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWordmark(x, y, scale = 1, alpha = 1, centered = false) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  const bw = 6 * scale;
  const gap = 8 * scale;
  const heights = [20, 32, 24].map((v) => v * scale);
  const barsW = bw * 3 + gap * 2;
  const textSize = 46 * scale;
  font(textSize, 600, F.sans);
  ctx.letterSpacing = "0px";
  const textW = ctx.measureText("wave").width;
  const contentW = barsW + 16 * scale + textW + 12 * scale;
  const ox = centered ? x - contentW / 2 : x;
  const base = y;
  const cols = [C.peach, C.coral, C.mint];
  heights.forEach((h, i) => {
    rrect(ox + i * (bw + gap), base - h, bw, h, bw / 2);
    ctx.fillStyle = cols[i];
    ctx.fill();
  });
  ctx.fillStyle = C.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0px";
  ctx.fillText("wave", ox + barsW + 16 * scale, base);
  dot(ox + barsW + 16 * scale + textW + 7 * scale, base - 3 * scale, 5 * scale, C.coral, 1);
  ctx.restore();
}

export function drawOrb(x, y, r, palette, t, motion = {}, opts = {}) {
  const speed = motion.speed ?? 1;
  const wobble = motion.wobble ?? 1;
  const halo = motion.halo ?? 1;
  const alpha = opts.alpha ?? 1;
  const breathe = opts.breathe ?? 1;
  const rr = r * breathe;

  ctx.save();
  ctx.globalAlpha *= alpha;

  glow(x, y, rr * 2.1, palette.accentHex || C.coral, 0.24 * halo);
  glow(x, y, rr * 1.25, palette.coreHex || C.peach, 0.3 * halo);

  const g = ctx.createRadialGradient(x - rr * 0.28, y - rr * 0.34, rr * 0.05, x, y, rr);
  g.addColorStop(0, palette.core[0]);
  g.addColorStop(0.32, palette.core[1]);
  g.addColorStop(0.62, palette.core[2]);
  g.addColorStop(0.85, palette.core[3]);
  g.addColorStop(1, palette.core[4]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, Math.PI * 2);
  ctx.fill();

  // warped luminous edge
  ctx.beginPath();
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    const wob =
      1 +
      Math.sin(a * 5 + t * 1.3 * speed) * 0.018 * wobble +
      Math.sin(a * 9 - t * 0.8 * speed) * 0.01 * wobble;
    const px = x + Math.cos(a) * rr * wob;
    const py = y + Math.sin(a) * rr * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = withAlpha(palette.secondary || "#ffd9a8", 0.82);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // inner bands
  for (let band = 0; band < 3; band++) {
    ctx.beginPath();
    const br = rr * (0.44 + band * 0.16);
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const wob = 1 + Math.sin(a * (3 + band) + t * (0.4 + band * 0.2) * speed) * 0.035 * wobble;
      const px = x + Math.cos(a) * br * wob;
      const py = y + Math.sin(a) * br * 0.82 * wob;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = withAlpha(palette.secondary || "#ffe9c9", 0.18 - band * 0.04);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // highlight
  const hg = ctx.createRadialGradient(x - rr * 0.34, y - rr * 0.4, 0, x - rr * 0.34, y - rr * 0.4, rr * 0.6);
  hg.addColorStop(0, "rgba(255,255,240,0.34)");
  hg.addColorStop(1, "rgba(255,255,240,0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(x - rr * 0.34, y - rr * 0.4, rr * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // orbit arcs
  ctx.strokeStyle = withAlpha(palette.accentHex || C.peach, 0.34);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, rr * 1.18, -0.9 + t * 0.08 * speed, 0.3 + t * 0.08 * speed);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(palette.accentHex || C.mint, 0.2);
  ctx.beginPath();
  ctx.arc(x, y, rr * 1.34, 1.9 - t * 0.06 * speed, 2.9 - t * 0.06 * speed);
  ctx.stroke();

  ctx.restore();
}

export const PALETTES = {
  bloom: { core: ["#ffe9b8", "#ffb271", "#ff6a5c", "#c42f68", "#2a1036"], accent: "#ff7c60", secondary: "#ffc57a", coreHex: "#ffb271" },
  glass: { core: ["#eafff8", "#9af0dc", "#59d8ef", "#8a7cf4", "#171534"], accent: "#69f3d3", secondary: "#96e0ff", coreHex: "#9af0dc" },
  tape: { core: ["#ffe6b8", "#e9b06a", "#d47752", "#8d4353", "#241422"], accent: "#ffb570", secondary: "#ff8970", coreHex: "#e9b06a" },
  haze: { core: ["#f4f0ff", "#c9c4ff", "#8e9bff", "#5860ad", "#15162f"], accent: "#96a0ff", secondary: "#82e1ff", coreHex: "#c9c4ff" },
  pulse: { core: ["#fff5d6", "#ffd177", "#ff945f", "#d64a68", "#291027"], accent: "#ff9664", secondary: "#6eebff", coreHex: "#ffd177" },
};

const MOTES = (() => {
  const rng = mulberry32(20261121);
  return Array.from({ length: 64 }, () => ({
    x: rng() * W,
    y: rng() * H,
    size: 1 + rng() * 2.4,
    speed: 3 + rng() * 9,
    phase: rng() * Math.PI * 2,
    alpha: 0.08 + rng() * 0.2,
    color: rng() > 0.5 ? C.peach : C.mint,
  }));
})();

export function drawBackground(t, warm = 1) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  let g = ctx.createRadialGradient(1380, 430, 0, 1380, 430, 980);
  g.addColorStop(0, withAlpha(C.coral, 0.13 * warm));
  g.addColorStop(0.45, withAlpha(C.coral, 0.045 * warm));
  g.addColorStop(1, withAlpha(C.coral, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  g = ctx.createRadialGradient(300, 820, 0, 300, 820, 800);
  g.addColorStop(0, withAlpha(C.mint, 0.045));
  g.addColorStop(1, withAlpha(C.mint, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.save();
  ctx.strokeStyle = "rgba(244,241,234,0.045)";
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(244,241,234,0.07)";
  for (let x = 0; x <= W; x += step * 5) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += step * 5) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // motes
  for (const m of MOTES) {
    const y = ((m.y - t * m.speed) % (H + 40) + H + 40) % (H + 40) - 20;
    const x = m.x + Math.sin(t * 0.11 + m.phase) * 22;
    dot(x, y, m.size, m.color, m.alpha);
  }

  // vignette
  g = ctx.createRadialGradient(W / 2, H / 2, 320, W / 2, H / 2, 1160);
  g.addColorStop(0, "rgba(3,5,12,0)");
  g.addColorStop(1, "rgba(3,5,12,0.72)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function chrome(scene, alpha = 1) {
  if (!scene) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  label(`${String(scene.index + 1).padStart(2, "0")} / ${String(scene.total).padStart(2, "0")}`, W - M.x, M.top + 8, { align: "right", color: "rgba(244,241,234,0.34)" });
  line(M.x, M.top + 28, W - M.x, M.top + 28, "rgba(244,241,234,0.10)", 1);
  if (CHROME.left) {
    text(CHROME.left, M.x, H - M.bottom, { size: 14, family: F.mono, color: "rgba(244,241,234,0.3)", ls: 3 });
  }
  if (CHROME.center && CHROME.left) {
    ctx.save();
    ctx.font = `400 14px "${F.mono}"`;
    ctx.letterSpacing = "3px";
    const leftWidth = ctx.measureText(CHROME.left).width;
    ctx.restore();
    text(CHROME.center, M.x + leftWidth + 26, H - M.bottom, { size: 14, family: F.mono, color: "rgba(244,241,234,0.22)", ls: 3 });
  }
  if (CHROME.right) {
    text(CHROME.right, W - M.x, H - M.bottom, { size: 14, family: F.mono, color: "rgba(244,241,234,0.22)", ls: 3, align: "right" });
  }
  ctx.restore();
}

export function sceneLabel(str, x = 110, y = 80, alpha = 1) {
  label(str, x, y, { alpha });
}

export function springPath(x0, x1, y, coils = 12, amp = 16) {
  ctx.beginPath();
  ctx.moveTo(x0, y);
  const len = Math.max(1, x1 - x0);
  for (let i = 0; i <= coils * 2; i++) {
    const p = i / (coils * 2);
    const px = x0 + len * p;
    const py = y + (i === 0 || i === coils * 2 ? 0 : (i % 2 === 0 ? -amp : amp));
    ctx.lineTo(px, py);
  }
}

export async function loadAssets(images) {
  const jobs = Object.entries(images).map(
    ([key, src]) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          IMG[key] = img;
          resolve();
        };
        img.onerror = () => reject(new Error(`Could not load asset "${key}" from ${src}`));
        img.src = src;
      }),
  );
  await Promise.all(jobs);
}

export async function loadTimeline(url = "/build/timeline.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}: ${res.status}`);
  return res.json();
}

export function buildScenes(timeline) {
  const segs = timeline.segments;
  return segs.map((seg, i) => {
    const start = i === 0 ? 0 : seg.start - 0.9;
    const end = i === segs.length - 1 ? timeline.duration : segs[i + 1].start - 0.9;
    return { id: seg.id, index: i, total: segs.length, start, end, seg };
  });
}
