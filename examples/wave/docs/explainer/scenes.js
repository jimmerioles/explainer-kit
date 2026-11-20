import {
  W,
  H,
  ctx,
  C,
  F,
  IMG,
  clamp,
  lerp,
  smooth,
  easeOut,
  easeInOut,
  span,
  pulse,
  withAlpha,
  font,
  text,
  label,
  paragraph,
  revealText,
  panel,
  rrect,
  line,
  curve,
  arrow,
  dot,
  ring,
  glow,
  image,
  imageCrop,
  drawSaw,
  drawTriangle,
  drawSine,
  drawWaveforms,
  drawWordmark,
  drawOrb,
  PALETTES,
  sceneLabel,
  springPath,
} from "/kit/render/helpers.js";

const DEMO = (await fetch("/project/demo-data.json").then((r) => r.json())).notes;
const DEMO_FILTER = [
  [0, 22],
  [8, 36],
  [24, 64],
  [32, 72],
  [40, 82],
  [44, 78],
  [48, 34],
];

function times(sc) {
  return sc.seg.sentences.map((s) => ({
    start: s.start - sc.start,
    end: s.end - sc.start,
    dur: s.duration,
  }));
}

function filterAt(beat) {
  if (beat <= 0) return DEMO_FILTER[0][1];
  for (let i = 1; i < DEMO_FILTER.length; i++) {
    const [b0, v0] = DEMO_FILTER[i - 1];
    const [b1, v1] = DEMO_FILTER[i];
    if (beat <= b1) return lerp(v0, v1, (beat - b0) / (b1 - b0));
  }
  return DEMO_FILTER[DEMO_FILTER.length - 1][1];
}

function header(str) {
  sceneLabel(str, 110, 80);
}

function pill(str, x, y, color = C.mint, opts = {}) {
  const { align = "left", size = 16, alpha = 1, fill = true } = opts;
  font(size, 400, F.mono);
  ctx.letterSpacing = "2px";
  const w = ctx.measureText(str.toUpperCase()).width + 28;
  const px = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (fill) {
    rrect(px, y - size - 7, w, size + 16, 999);
    ctx.fillStyle = withAlpha(color, 0.1);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  text(str.toUpperCase(), px + 14, y, { size, family: F.mono, color, ls: 2 });
  ctx.restore();
  return w;
}

function codeCard(lines, x, y, w, opts = {}) {
  const { size = 19, alpha = 1, accent = C.mint, title = null } = opts;
  const lh = size * 1.75;
  const h = lines.length * lh + (title ? 58 : 34);
  panel(x, y, w, h, { r: 14, fill: "rgba(8,12,24,0.78)", stroke: "rgba(244,241,234,0.10)", alpha });
  if (title) label(title, x + 22, y + 32, { alpha, size: 14 });
  lines.forEach((ln, i) => {
    text(ln, x + 22, y + (title ? 62 : 34) + i * lh, {
      size,
      family: F.mono,
      color: ln.startsWith("//") ? C.faint : accent,
      alpha,
    });
  });
  return h;
}

function keyCard(x, y, w, h, letter, note, hz, press, alpha = 1) {
  const sc = 1 - 0.035 * press;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(sc, sc);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  panel(x, y, w, h, {
    r: 20,
    fill: press > 0.5 ? "rgba(255,106,77,0.22)" : "rgba(10,14,28,0.72)",
    stroke: press > 0.5 ? withAlpha(C.coral, 0.8) : "rgba(244,241,234,0.16)",
    lw: 1.6,
    alpha,
    glow: press > 0.5 ? withAlpha(C.coral, 0.8) : null,
  });
  text(letter, x + 34, y + h - 34, { size: 104, weight: 600, color: C.ink, alpha });
  text(note, x + w - 30, y + 50, { size: 22, family: F.mono, color: C.peach, align: "right", alpha });
  text(hz, x + w - 30, y + 82, { size: 16, family: F.mono, color: C.dim, align: "right", alpha });
  label("hold", x + 34, y + 38, { size: 14, alpha: alpha * 0.8 });
  ctx.restore();
}

// ---------------------------------------------------------------- intro

function intro(lt, sc) {
  const s = times(sc);
  const s2 = s[2]?.start ?? 8;
  const s3 = s[3]?.start ?? 12;
  const s4 = s[4]?.start ?? 17;

  // rings behind the wordmark
  const ringP = easeOut(span(lt, s[0]?.start ?? 1, (s[0]?.start ?? 1) + 4));
  for (let i = 0; i < 4; i++) {
    ring(960, 500, 180 + i * 62 + ringP * 20, withAlpha(i % 2 ? C.mint : C.coral, 0.1 - i * 0.015), 1, 1, [2, 10]);
  }

  const shrink = easeInOut(span(lt, s2 - 0.9, s2 - 0.05));
  const wx = lerp(960, 110, shrink);
  const wy = lerp(520, 96, shrink);
  const ws = lerp(1.55, 0.62, shrink);
  drawWordmark(wx, wy, ws, 1, shrink < 0.5);

  const tagA = (1 - smooth(span(lt, s2 - 0.2, s2 + 0.6))) * smooth(span(lt, s[0]?.start ?? 1, (s[0]?.start ?? 1) + 0.8));
  if (tagA > 0) {
    text("the playable synth", 960, 600, {
      size: 24,
      family: F.mono,
      color: C.dim,
      ls: 5,
      align: "center",
      alpha: tagA,
    });
    text("no video · no samples · no fake waveform", 960, 650, {
      size: 18,
      family: F.mono,
      color: "rgba(244,241,234,0.36)",
      ls: 2,
      align: "center",
      alpha: tagA,
    });
  }

  // three statements
  const stats = [
    { a: "Eight keys.", color: C.ink, serif: false },
    { a: "Five moods.", color: C.peach, serif: false },
    { a: "No samples.", color: C.coral, serif: true },
  ];
  const statsOut = 1 - smooth(span(lt, s3 - 0.2, s3 + 0.6));
  stats.forEach((st, i) => {
    const p = easeOut(span(lt, s2 + 0.1 + i * 0.55, s2 + 0.85 + i * 0.55));
    if (p <= 0) return;
    const yy = 360 + i * 108 + (1 - p) * 24;
    dot(566, yy - 28, 6, i === 0 ? C.mint : i === 1 ? C.peach : C.coral, p * statsOut);
    revealText(st.a, 610, yy, p, {
      size: 86,
      weight: 500,
      family: st.serif ? F.serif : F.sans,
      style: st.serif ? "italic" : "normal",
      color: st.color,
      alpha: statsOut,
    });
  });

  // app screenshot, then a match cut that grows the stage out of the page
  const appP = easeOut(span(lt, s3 - 0.3, s3 + 1.2));
  if (appP > 0) {
    const z = easeInOut(span(lt, s4 + 0.3, s4 + 2.6));
    const dx = 300;
    const dy = 190 + (1 - appP) * 80;
    const dw = 1320;
    const dh = 825;
    const appAlpha = appP * (1 - smooth(span(z, 0.02, 0.42)));
    ctx.save();
    ctx.globalAlpha *= appAlpha;
    glow(dx + dw / 2, dy + dh / 2, dw * 0.62, C.coral, 0.12);
    panel(dx - 8, dy - 8, dw + 16, dh + 16, {
      r: 24,
      fill: "rgba(8,10,22,0.4)",
      stroke: "rgba(244,241,234,0.14)",
      glow: withAlpha(C.coral, 0.2),
    });
    image("app", dx, dy, dw, dh, 1, 16, 1);
    ctx.restore();

    const sdx = lerp(935, 340, z);
    const sdy = lerp(318, 150, z);
    const sdw = lerp(581, 1240, z);
    const sdh = lerp(339, 724, z);
    ctx.save();
    ctx.globalAlpha *= appP;
    glow(sdx + sdw / 2, sdy + sdh / 2, sdw * 0.56, C.coral, 0.14 + 0.06 * z);
    panel(sdx - 8, sdy - 8, sdw + 16, sdh + 16, {
      r: 24,
      fill: "rgba(8,10,22,0.4)",
      stroke: withAlpha(C.coral, 0.18 + 0.3 * z),
      glow: withAlpha(C.coral, 0.24),
    });
    image("stage", sdx, sdy, sdw, sdh, 1, 16, 1.01 + z * 0.015);
    ctx.restore();

  }
}

// ---------------------------------------------------------------- thesis

function thesis(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 6;
  const s2 = s[2]?.start ?? 14;

  header("The signal");

  revealText("Not an", 110, 300, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1.1)), {
    size: 82,
    weight: 500,
    color: C.ink,
  });
  revealText("illustration.", 110, 392, easeOut(span(lt, (s[0]?.start ?? 0) + 0.4, (s[0]?.start ?? 0) + 1.5)), {
    size: 82,
    weight: 500,
    color: C.ink,
  });

  const aP = 1 - smooth(span(lt, s2 - 0.2, s2 + 0.7));
  const bP = smooth(span(lt, s2 + 0.2, s2 + 1.1));
  revealText("A measurement.", 110, 512, easeOut(span(lt, (s[0]?.start ?? 0) + 0.9, (s[0]?.start ?? 0) + 2.1)), {
    size: 92,
    family: F.serif,
    style: "italic",
    color: C.coral,
    alpha: aP,
  });
  revealText("It's listening.", 110, 512, easeOut(span(lt, s2 + 0.1, s2 + 1.1)), {
    size: 92,
    family: F.serif,
    style: "italic",
    color: C.mint,
    alpha: bP,
  });

  paragraph(
    "The orb is not a video on a loop. It is reading the same analyser the synth feeds, then smoothing what it finds.",
    110,
    602,
    690,
    { size: 27, color: C.dim, alpha: smooth(span(lt, (s[0]?.start ?? 0) + 1.6, (s[0]?.start ?? 0) + 2.8)) },
  );

  // ghost cards, then the stage
  const ghostOut = 1 - smooth(span(lt, s1 - 0.4, s1 + 0.7));
  if (ghostOut > 0) {
    const cards = [
      { x: 930, y: 260, t: "VIDEO LOOP", icon: "play" },
      { x: 1320, y: 260, t: "FAKE SPECTRUM", icon: "bars" },
    ];
    cards.forEach((cd, i) => {
      const p = smooth(span(lt, (s[0]?.start ?? 0) + 0.5 + i * 0.35, (s[0]?.start ?? 0) + 1.4 + i * 0.35));
      panel(cd.x, cd.y, 350, 210, { r: 18, alpha: p * ghostOut, fill: "rgba(10,14,28,0.42)", stroke: "rgba(244,241,234,0.1)" });
      if (cd.icon === "play") {
        ctx.save();
        ctx.globalAlpha *= p * ghostOut;
        ctx.strokeStyle = C.faint;
        ctx.lineWidth = 2;
        ring(cd.x + 70, cd.y + 92, 34, C.faint, 1.5);
        ctx.beginPath();
        ctx.moveTo(cd.x + 62, cd.y + 76);
        ctx.lineTo(cd.x + 86, cd.y + 92);
        ctx.lineTo(cd.x + 62, cd.y + 108);
        ctx.closePath();
        ctx.fillStyle = C.faint;
        ctx.fill();
        ctx.restore();
      } else {
        for (let k = 0; k < 7; k++) {
          const bh = 18 + ((k * 37) % 52);
          ctx.fillStyle = withAlpha(C.faint.startsWith("rgba") ? "#f4f1ea" : C.faint, 0.22 * p * ghostOut);
          ctx.fillRect(cd.x + 44 + k * 18, cd.y + 120 - bh / 2, 8, bh);
        }
      }
      text(cd.t, cd.x + 26, cd.y + 178, { size: 18, family: F.mono, color: C.dim, ls: 2, alpha: p * ghostOut });
      const strike = smooth(span(lt, (s[0]?.start ?? 0) + 2.2 + i * 0.4, (s[0]?.start ?? 0) + 2.9 + i * 0.4));
      if (strike > 0) {
        line(cd.x + 26, cd.y + 150, cd.x + 26 + 300 * strike, cd.y + 20, withAlpha(C.coral, 0.85), 3, null, ghostOut);
      }
    });
  }

  const stageP = smooth(span(lt, s1 - 0.2, s1 + 1));
  if (stageP > 0) {
    const dx = 900;
    const dy = 230;
    const dw = 880;
    const dh = 514;
    ctx.save();
    ctx.globalAlpha *= stageP;
    glow(dx + dw / 2, dy + dh / 2, 620, C.coral, 0.12);
    panel(dx - 7, dy - 7, dw + 14, dh + 14, { r: 20, fill: "rgba(8,10,22,0.4)", stroke: "rgba(244,241,234,0.14)", glow: withAlpha(C.coral, 0.14) });
    image("stage", dx, dy, dw, dh, 1, 12);
    ctx.restore();
    const connP = smooth(span(lt, s1 + 1.8, s1 + 2.8));
    if (connP > 0) {
      line(1340, dy + dh + 5, 1340, 786, withAlpha(C.mint, 0.35), 1.2, [4, 6], connP);
      text("same signal", 1360, dy + dh + 28, { size: 13, family: F.mono, color: C.mint, alpha: connP });
    }
  }

  const waveP = easeOut(span(lt, s1 + 0.2, s1 + 1.3));
  if (waveP > 0) {
    const px = 110;
    const py = 790;
    const pw = 1700;
    const ph = 156;
    panel(px, py, pw, ph, { r: 14, alpha: waveP, fill: "rgba(8,12,24,0.72)", stroke: "rgba(244,241,234,0.1)" });
    label("ANALYSER · TIME DOMAIN", px + 24, py + 34, { alpha: waveP, size: 14 });
    text("2048 samples, every frame", px + pw - 24, py + 34, { size: 14, family: F.mono, color: C.dim, align: "right", alpha: waveP * 0.8 });
    ctx.save();
    ctx.globalAlpha *= waveP;
    ctx.beginPath();
    ctx.rect(px, py + 48, pw, ph - 60);
    ctx.clip();
    drawWaveforms(px + 8, py + 56, pw - 16, ph - 68, lt, C.coral, 0.9);
    drawWaveforms(px + 8, py + 56, pw - 16, ph - 68, lt + 0.37, C.mint, 0.22);
    ctx.restore();
    // playhead
    const phx = px + 40 + ((lt * 180) % (pw - 80));
    line(phx, py + 50, phx, py + ph - 14, withAlpha(C.mint, 0.4), 1);
  }
}

// ---------------------------------------------------------------- voice

function voice(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 3;
  const s2 = s[2]?.start ?? 6;
  const s3 = s[3]?.start ?? 14;
  const s4 = s[4]?.start ?? 22;

  header("One voice");
  revealText("One key. One voice.", 110, 190, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1)), {
    size: 52,
    weight: 500,
    color: C.ink,
  });

  const press = smooth(span(lt, s1 + 0.25, s1 + 0.5));
  keyCard(110, 300, 260, 200, "A", "C3", "130.81 Hz", press, 1);
  if (press > 0.5) {
    const rp = span(lt, s1 + 0.3, s1 + 1.6);
    if (rp > 0 && rp < 1) ring(240, 400, 80 + rp * 90, withAlpha(C.coral, 0.5 * (1 - rp)), 1.5);
  }
  label("press and hold", 110, 548, { size: 14 });

  // converging lines
  const nodeX = 1060;
  const nodeY = 468;
  const cards = [
    { y: 230, name: "SAW", weight: "0.50", color: C.coral, draw: drawSaw },
    { y: 400, name: "TRIANGLE", weight: "0.28", color: C.peach, draw: drawTriangle },
    { y: 570, name: "SINE", weight: "0.18", color: C.mint, draw: drawSine },
  ];
  const oscP = cards.map((_, i) => easeOut(span(lt, s2 + 0.15 + i * 0.45, s2 + 0.9 + i * 0.45)));
  cards.forEach((cd, i) => {
    const p = oscP[i];
    if (p <= 0) return;
    const x = 390 - (1 - p) * 40;
    const y = cd.y;
    const w = 500;
    const h = 140;
    panel(x, y, w, h, { r: 16, alpha: p, fill: "rgba(10,14,28,0.68)", stroke: withAlpha(cd.color, 0.24) });
    text(cd.name, x + 24, y + 40, { size: 18, family: F.mono, color: cd.color, ls: 2, alpha: p });
    text(cd.weight, x + 24, y + 108, { size: 26, family: F.mono, color: C.ink, alpha: p });
    label("mix", x + 100, y + 108, { size: 11, alpha: p * 0.7 });
    cd.draw(x + 190, y + 28, w - 220, h - 56, lt * (0.35 + i * 0.08), cd.color, 2.2, p);
    // detuned ghost
    cd.draw(x + 190, y + 28, w - 220, h - 56, lt * (0.35 + i * 0.08) + 0.02, C.ink, 1, p * 0.12);
    const cy = y + h / 2;
    const tx = nodeX - 56;
    const ty = nodeY + (cy - nodeY) * 0.16;
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.strokeStyle = withAlpha(cd.color, 0.42);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(x + w, cy);
    ctx.quadraticCurveTo(x + w + 70, cy, tx, ty);
    ctx.stroke();
    ctx.restore();
    dot(tx, ty, 3, cd.color, p * 0.8, 8);
  });

  // voice node
  const nodeP = easeOut(span(lt, s1 + 0.4, s1 + 1.2));
  if (nodeP > 0) {
    glow(nodeX, nodeY, 120, C.coral, 0.22 * nodeP);
    const g = ctx.createRadialGradient(nodeX - 14, nodeY - 16, 2, nodeX, nodeY, 50);
    g.addColorStop(0, "#ffe9b8");
    g.addColorStop(0.55, C.coral);
    g.addColorStop(1, "#8d1f45");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, 48 * (0.9 + 0.1 * nodeP), 0, Math.PI * 2);
    ctx.fill();
    ring(nodeX, nodeY, 58 + Math.sin(lt * 1.6) * 3, withAlpha(C.coral, 0.5 * nodeP), 1.2);
    text("VOICE", nodeX, nodeY + 96, { size: 18, family: F.mono, color: C.peach, ls: 3, align: "center", alpha: nodeP });
    text("3 oscillators · detune", nodeX, nodeY + 122, { size: 15, family: F.mono, color: C.dim, align: "center", alpha: nodeP });
    arrow(nodeX + 62, nodeY, 1218, nodeY, withAlpha(C.peach, 0.45), 1.4, 8, nodeP);
  }

  // envelope
  const envP = easeOut(span(lt, s3 - 0.1, s3 + 0.8));
  if (envP > 0) {
    const px = 1230;
    const py = 200;
    const pw = 570;
    const ph = 430;
    panel(px, py, pw, ph, { r: 16, alpha: envP, fill: "rgba(10,14,28,0.68)", stroke: withAlpha(C.peach, 0.18) });
    label("AMPLITUDE ENVELOPE", px + 24, py + 36, { alpha: envP, size: 14, color: C.peach });
    const gx = px + 52;
    const gy = py + 74;
    const gw = pw - 92;
    const gh = ph - 138;
    // grid
    for (let i = 0; i <= 4; i++) {
      line(gx, gy + (gh / 4) * i, gx + gw, gy + (gh / 4) * i, "rgba(244,241,234,0.07)", 1, null, envP);
    }
    const y0 = gy + gh;
    const top = gy + 8;
    const sustain = 0.62;
    const pts = [
      [gx, y0],
      [gx + gw * 0.12, top],
      [gx + gw * 0.36, y0 - (y0 - top) * sustain],
      [gx + gw * 0.64, y0 - (y0 - top) * sustain],
      [gx + gw, y0],
    ];
    ctx.save();
    ctx.globalAlpha *= envP;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(gx + gw, y0);
    ctx.closePath();
    const fg = ctx.createLinearGradient(0, top, 0, y0);
    fg.addColorStop(0, withAlpha(C.coral, 0.32));
    fg.addColorStop(1, withAlpha(C.coral, 0.02));
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
    curve(pts, C.coral, 2.6, envP);

    // A D S R
    const segs = [
      ["A", gx + gw * 0.06, y0 + 32],
      ["D", gx + gw * 0.24, y0 + 32],
      ["S", gx + gw * 0.5, y0 + 32],
      ["R", gx + gw * 0.82, y0 + 32],
    ];
    segs.forEach(([ch, xx, yy]) => text(ch, xx, yy, { size: 16, family: F.mono, color: C.peach, align: "center", alpha: envP }));

    if (lt > s3) {
      const phase = ((lt - s3) % 3.4) / 3.4;
      let x;
      let y;
      if (phase < 0.16) {
        const q = phase / 0.16;
        x = lerp(gx, gx + gw * 0.12, q);
        y = lerp(y0, top, q);
      } else if (phase < 0.4) {
        const q = (phase - 0.16) / 0.24;
        x = lerp(gx + gw * 0.12, gx + gw * 0.36, q);
        y = lerp(top, y0 - (y0 - top) * sustain, q);
      } else if (phase < 0.68) {
        const q = (phase - 0.4) / 0.28;
        x = lerp(gx + gw * 0.36, gx + gw * 0.64, q);
        y = y0 - (y0 - top) * sustain;
      } else {
        const q = (phase - 0.68) / 0.32;
        x = lerp(gx + gw * 0.64, gx + gw, q);
        y = lerp(y0 - (y0 - top) * sustain, y0, q);
      }
      line(x, gy, x, y0, withAlpha(C.mint, 0.22), 1, [4, 6], envP);
      dot(x, y, 7, C.mint, envP, 14);
    }
  }

  // eight voices
  const eightP = easeOut(span(lt, s4 - 0.1, s4 + 0.9));
  if (eightP > 0) {
    label("8 voices · polyphonic", 1230, 700, { alpha: eightP, size: 14 });
    for (let i = 0; i < 8; i++) {
      const h = 18 + Math.abs(Math.sin(lt * 1.4 + i * 0.7)) * 54 + (i === 0 ? 22 : 0);
      const x = 1234 + i * 70;
      const y = 760 - h;
      rrect(x, y, 34, h, 8);
      ctx.fillStyle = i === 0 ? withAlpha(C.coral, 0.8 * eightP) : withAlpha(C.peach, 0.23 * eightP);
      ctx.fill();
    }
    text("one per pad", 1230, 792, { size: 15, family: F.mono, color: C.dim, alpha: eightP });
  }
}

// ---------------------------------------------------------------- chain

function chainNode(x, y, w, h, name, type, hi, color) {
  const active = hi;
  panel(x, y, w, h, {
    r: 14,
    fill: active > 0.4 ? "rgba(22,18,32,0.9)" : "rgba(10,14,28,0.72)",
    stroke: active > 0.4 ? withAlpha(color, 0.7) : "rgba(244,241,234,0.14)",
    lw: 1.4,
    glow: active > 0.4 ? withAlpha(color, 0.5) : null,
  });
  const cx = x + w / 2;
  const cy = y + 54;
  ctx.save();
  ctx.globalAlpha *= 0.9;
  ctx.strokeStyle = active > 0.4 ? color : C.faint;
  ctx.fillStyle = active > 0.4 ? color : C.faint;
  ctx.lineWidth = 1.8;
  if (type === "voice") {
    [24, 44, 32].forEach((bh, i) => {
      rrect(cx - 26 + i * 20, cy - bh / 2, 8, bh, 4);
      ctx.fill();
    });
  } else if (type === "bus") {
    [0, 1, 2].forEach((i) => {
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 14 + i * 14);
      ctx.lineTo(cx + 30, cy - 14 + i * 14);
      ctx.stroke();
    });
  } else if (type === "filter") {
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy - 10);
    ctx.lineTo(cx - 4, cy - 10);
    ctx.quadraticCurveTo(cx + 12, cy - 10, cx + 18, cy + 12);
    ctx.lineTo(cx + 32, cy + 12);
    ctx.stroke();
  } else if (type === "clip") {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const p = i / 64;
      const v = Math.sin(p * Math.PI * 4 + 0.5) * 20;
      const px = cx - 32 + p * 64;
      const py = cy - clamp(v, -9, 9);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else if (type === "comp") {
    [26, 38, 18, 32].forEach((bh, i) => {
      const y2 = cy + 20 - bh;
      ctx.fillRect(cx - 30 + i * 16, y2, 9, bh);
    });
  } else if (type === "analyser") {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const p = i / 48;
      const v = Math.sin(p * Math.PI * 6) * 16;
      const px = cx - 30 + p * 60;
      const py = cy + v;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const hh = 4 + ((i * 7) % 18);
      ctx.fillRect(cx - 27 + i * 10, cy + 30 - hh, 4, hh);
    }
  } else if (type === "mute") {
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 7);
    ctx.lineTo(cx - 14, cy - 7);
    ctx.lineTo(cx + 2, cy - 22);
    ctx.lineTo(cx + 2, cy + 22);
    ctx.lineTo(cx - 14, cy + 7);
    ctx.lineTo(cx - 28, cy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy - 12);
    ctx.lineTo(cx + 28, cy + 12);
    ctx.moveTo(cx + 28, cy - 12);
    ctx.lineTo(cx + 12, cy + 12);
    ctx.stroke();
  } else if (type === "out") {
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 4);
    ctx.lineTo(cx - 14, cy - 4);
    ctx.lineTo(cx - 2, cy - 18);
    ctx.lineTo(cx - 2, cy + 18);
    ctx.lineTo(cx - 14, cy + 4);
    ctx.lineTo(cx - 26, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy, 12, -0.8, 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 2, cy, 22, -0.8, 0.8);
    ctx.stroke();
  }
  ctx.restore();
  text(name, cx, y + h - 18, {
    size: 16,
    family: F.mono,
    color: active > 0.4 ? C.ink : C.dim,
    ls: 2,
    align: "center",
  });
}

function chain(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 3;
  const s2 = s[2]?.start ?? 9;
  const s3 = s[3]?.start ?? 18;
  const s4 = s[4]?.start ?? 24;

  header("The shared chain");

  const names = ["VOICE", "BUS", "FILTER", "CLIP", "COMP", "ANALYSER", "MUTE", "OUT"];
  const types = ["voice", "bus", "filter", "clip", "comp", "analyser", "mute", "out"];
  const w = 150;
  const gap = 52;
  const y = 350;
  const h = 150;
  const centers = names.map((_, i) => 178 + w / 2 + i * (w + gap));

  // wires
  for (let i = 0; i < centers.length - 1; i++) {
    line(centers[i] + w / 2, y + h / 2, centers[i + 1] - w / 2, y + h / 2, "rgba(244,241,234,0.18)", 1.4);
    arrow(centers[i] + w / 2 + 8, y + h / 2, centers[i + 1] - w / 2 - 6, y + h / 2, "rgba(244,241,234,0.3)", 1.4, 7);
  }

  const hiFilter = smooth(span(lt, s1 - 0.2, s1 + 0.6));
  const hiSends = smooth(span(lt, s2 - 0.2, s2 + 0.7));
  const hiDrive = smooth(span(lt, s3 - 0.2, s3 + 0.7));
  const hiAnalyser = smooth(span(lt, s4 - 0.2, s4 + 0.7));

  names.forEach((nm, i) => {
    let hi = 0;
    if (i === 2) hi = hiFilter;
    if (i === 3 || i === 4) hi = hiDrive;
    if (i === 5) hi = hiAnalyser;
    chainNode(centers[i] - w / 2, y, w, h, nm, types[i], hi, i === 2 ? C.mint : i === 5 ? C.cyan : C.peach);
  });

  // signal pulses
  for (let i = 0; i < 12; i++) {
    const p = ((lt * 0.34 + i / 12) % 1 + 1) % 1;
    const x = lerp(centers[0], centers[centers.length - 1], p);
    dot(x, y + h / 2, 3.5, C.peach, 0.55, 10);
  }

  // filter response
  if (hiFilter > 0) {
    const fx = centers[2] - 130;
    const fy = 145;
    const fw = 260;
    panel(fx, fy, fw, 155, { r: 12, alpha: hiFilter, fill: "rgba(8,12,24,0.82)", stroke: withAlpha(C.mint, 0.3) });
    const gx = fx + 24;
    const gy = fy + 34;
    const gw = fw - 48;
    const gh = 78;
    arrow(gx, gy + gh, gx + gw, gy + gh, C.faint, 1, 6, hiFilter);
    arrow(gx, gy + gh, gx, gy, C.faint, 1, 6, hiFilter);
    const cut = 0.35 + 0.12 * Math.sin(lt * 1.1);
    ctx.save();
    ctx.globalAlpha *= hiFilter;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const p = i / 60;
      const v = 1 / (1 + Math.pow(p / cut, 4));
      const px = gx + p * gw;
      const py = gy + gh - v * gh * 0.86;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.mint;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    text("resonant low-pass", fx + 24, fy + 138, { size: 12, family: F.mono, color: C.mint, alpha: hiFilter });
    text("1.5 kHz", fx + fw - 24, fy + 138, { size: 12, family: F.mono, color: C.dim, align: "right", alpha: hiFilter });
  }

  // sends rack
  const rackX = 380;
  const rackY = 590;
  const rackW = 420;
  const rackH = 240;
  if (hiSends > 0) {
    panel(rackX, rackY, rackW, rackH, { r: 14, alpha: hiSends, fill: "rgba(8,12,24,0.82)", stroke: withAlpha(C.peach, 0.22) });
    label("SENDS", rackX + 22, rackY + 32, { size: 12, color: C.peach, alpha: hiSends });
    line(centers[1], y + h + 6, centers[1], rackY - 6, withAlpha(C.peach, 0.4), 1.3, [5, 7], hiSends);
    arrow(centers[1], rackY - 34, centers[1], rackY - 8, withAlpha(C.peach, 0.5), 1.3, 7, hiSends);
    text("send", centers[1] + 12, rackY - 18, { size: 11, family: F.mono, color: C.dim, alpha: hiSends });
    arrow(rackX + rackW - 24, rackY + 4, centers[2] + 10, y + h + 8, withAlpha(C.mint, 0.45), 1.3, 7, hiSends);
    text("return", rackX + rackW - 70, rackY - 18, { size: 11, family: F.mono, color: C.dim, alpha: hiSends });

    const rows = [
      { name: "ECHO", color: C.peach, sub: "ping-pong, damped", y: rackY + 56, bars: false },
      { name: "REVERB", color: C.violet, sub: "generated impulse", y: rackY + 138, bars: true },
    ];
    rows.forEach((row) => {
      text(row.name, rackX + 22, row.y + 10, { size: 15, family: F.mono, color: row.color, ls: 2, alpha: hiSends });
      text(row.sub, rackX + 22, row.y + 34, { size: 12, family: F.mono, color: C.dim, alpha: hiSends });
      if (!row.bars) {
        line(rackX + 168, row.y + 2, rackX + 280, row.y + 2, withAlpha(row.color, 0.5), 1.2, null, hiSends);
        line(rackX + 214, row.y + 20, rackX + 310, row.y + 20, withAlpha(row.color, 0.35), 1.2, null, hiSends);
        line(rackX + 250, row.y + 38, rackX + 334, row.y + 38, withAlpha(row.color, 0.2), 1.2, null, hiSends);
      } else {
        for (let k = 0; k < 7; k++) {
          const bh = 8 + (k % 3) * 8;
          ctx.fillStyle = withAlpha(row.color, 0.42 * hiSends);
          ctx.fillRect(rackX + 176 + k * 22, row.y + 28 - bh, 9, bh);
        }
      }
      arrow(rackX + 340, row.y + 20, rackX + 390, row.y + 20, withAlpha(row.color, 0.45), 1.2, 6, hiSends);
    });
  }

  // analyser branch
  if (hiAnalyser > 0) {
    const px = 1000;
    const py = 130;
    const pw = 520;
    const ph = 180;
    const ax = centers[5];
    line(ax, y - 6, ax, py + ph + 4, withAlpha(C.cyan, 0.45), 1.4, [5, 7], hiAnalyser);
    arrow(ax, py + ph + 30, ax, py + ph + 6, withAlpha(C.cyan, 0.5), 1.3, 7, hiAnalyser);
    panel(px, py, pw, ph, { r: 14, alpha: hiAnalyser, fill: "rgba(8,12,24,0.85)", stroke: withAlpha(C.cyan, 0.32) });
    label("ANALYSER → STAGE", px + 20, py + 30, { size: 13, color: C.cyan, alpha: hiAnalyser });
    drawOrb(px + 76, py + 102, 46, PALETTES.bloom, lt, { speed: 1, wobble: 1, halo: 1 }, { alpha: hiAnalyser });
    drawWaveforms(px + 148, py + 64, 330, 70, lt, C.mint, 0.8 * hiAnalyser);
    text("a copy for the visuals", px + 20, py + ph - 18, { size: 13, family: F.mono, color: C.dim, alpha: hiAnalyser });
  }

  // drive detail
  if (hiDrive > 0) {
    const a = 0.9 * hiDrive;
    text("soft clip", centers[3], y - 16, { size: 12, family: F.mono, color: C.peach, align: "center", alpha: a });
    text("gain control", centers[4], y - 16, { size: 12, family: F.mono, color: C.peach, align: "center", alpha: a });
  }
}

// ---------------------------------------------------------------- mute

function mute(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 5;
  const s2 = s[2]?.start ?? 11;

  header("The quiet trick");
  revealText("Mute comes after", 110, 230, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1)), {
    size: 68,
    weight: 500,
    color: C.ink,
  });
  revealText("the analyser.", 110, 340, easeOut(span(lt, (s[0]?.start ?? 0) + 0.3, (s[0]?.start ?? 0) + 1.4)), {
    size: 92,
    family: F.serif,
    style: "italic",
    color: C.mint,
  });

  const px = 110;
  const py = 450;
  const pw = 1700;
  const ph = 320;
  panel(px, py, pw, ph, { r: 18, fill: "rgba(8,12,24,0.6)", stroke: "rgba(244,241,234,0.1)" });

  const y = 630;
  const xs = [250, 620, 1020, 1330, 1620];
  for (let i = 0; i < xs.length - 1; i++) {
    line(xs[i] + 70, y, xs[i + 1] - 70, y, "rgba(244,241,234,0.16)", 1.5);
    arrow(xs[i] + 70, y, xs[i + 1] - 70, y, "rgba(244,241,234,0.28)", 1.4, 7);
  }
  // signal source
  panel(xs[0] - 70, y - 54, 140, 108, { r: 14, fill: "rgba(16,16,30,0.9)", stroke: withAlpha(C.coral, 0.4) });
  text("SIGNAL", xs[0], y + 4, { size: 14, family: F.mono, color: C.coral, ls: 2, align: "center" });
  for (let i = 0; i < 3; i++) {
    const hh = 12 + i * 8;
    ctx.fillStyle = withAlpha(C.coral, 0.5);
    ctx.fillRect(xs[0] - 24 + i * 16, y - 18 - hh / 2, 7, hh);
  }

  // analyser
  panel(xs[1] - 80, y - 58, 160, 116, { r: 14, fill: "rgba(16,16,30,0.9)", stroke: withAlpha(C.cyan, 0.55), glow: withAlpha(C.cyan, 0.3) });
  text("ANALYSER", xs[1], y + 42, { size: 13, family: F.mono, color: C.cyan, ls: 2, align: "center" });
  drawWaveforms(xs[1] - 56, y - 44, 112, 66, lt, C.mint, 0.9);

  // stage branch
  line(xs[1], y - 66, xs[1], 550, withAlpha(C.mint, 0.45), 1.3, [4, 6]);
  panel(xs[1] - 82, 462, 164, 88, { r: 12, fill: "rgba(8,12,24,0.9)", stroke: withAlpha(C.mint, 0.35), glow: withAlpha(C.mint, 0.18) });
  drawOrb(xs[1] - 44, 506, 26, PALETTES.bloom, lt, { speed: 1.2, wobble: 1, halo: 1 });
  text("STAGE", xs[1] + 4, 502, { size: 13, family: F.mono, color: C.mint, ls: 2 });
  text("still live", xs[1] + 4, 524, { size: 12, family: F.mono, color: C.dim });

  // master
  panel(xs[2] - 70, y - 50, 140, 100, { r: 14, fill: "rgba(16,16,30,0.9)", stroke: "rgba(244,241,234,0.2)" });
  text("MASTER", xs[2], y + 42, { size: 13, family: F.mono, color: C.dim, ls: 2, align: "center" });
  line(xs[2] - 36, y - 10, xs[2] + 36, y - 10, "rgba(244,241,234,0.18)", 6);
  dot(xs[2] + 14, y - 10, 10, C.peach);

  // mute toggle
  const muteP = smooth(span(lt, s1 - 0.1, s1 + 0.7));
  panel(xs[3] - 78, y - 58, 156, 116, { r: 14, fill: "rgba(16,16,30,0.9)", stroke: withAlpha(C.coral, 0.5) });
  text("MUTE", xs[3], y + 42, { size: 13, family: F.mono, color: C.coral, ls: 2, align: "center" });
  const tw = 84;
  const th = 34;
  const tx = xs[3] - tw / 2;
  const ty = y - 30;
  rrect(tx, ty, tw, th, th / 2);
  ctx.fillStyle = muteP > 0.5 ? "rgba(255,106,77,0.12)" : "rgba(109,243,205,0.16)";
  ctx.fill();
  ctx.strokeStyle = muteP > 0.5 ? withAlpha(C.coral, 0.5) : withAlpha(C.mint, 0.5);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  const knobX = lerp(tx + th / 2, tx + tw - th / 2, muteP);
  dot(knobX, ty + th / 2, th / 2 - 6, muteP > 0.5 ? C.coral : C.mint, 1, 12);
  text(muteP > 0.5 ? "OFF" : "ON", xs[3], y - 44, {
    size: 12,
    family: F.mono,
    color: muteP > 0.5 ? C.coral : C.mint,
    ls: 2,
    align: "center",
  });

  // speakers
  const live = 1 - muteP;
  panel(xs[4] - 70, y - 50, 140, 100, { r: 14, fill: "rgba(16,16,30,0.9)", stroke: withAlpha(C.peach, 0.3) });
  ctx.save();
  ctx.globalAlpha *= 1;
  ctx.fillStyle = muteP > 0.5 ? C.faint : C.peach;
  ctx.beginPath();
  ctx.moveTo(xs[4] - 34, y - 6);
  ctx.lineTo(xs[4] - 20, y - 6);
  ctx.lineTo(xs[4] - 6, y - 22);
  ctx.lineTo(xs[4] - 6, y + 22);
  ctx.lineTo(xs[4] - 20, y + 6);
  ctx.lineTo(xs[4] - 34, y + 6);
  ctx.closePath();
  ctx.fill();
  if (live > 0.05) {
    ctx.strokeStyle = C.peach;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = live;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(xs[4] - 4, y, 12 + i * 11, -0.8, 0.8);
      ctx.stroke();
    }
  }
  ctx.restore();
  text("SPEAKERS", xs[4], y + 42, { size: 13, family: F.mono, color: C.dim, ls: 2, align: "center" });

  // output waveform
  if (live > 0.05) {
    drawWaveforms(1720, y - 30, 70, 60, lt, C.peach, 0.7 * live);
  } else {
    line(1720, y, 1790, y, withAlpha("#f4f1ea", 0.22), 1.2);
    text("silence", 1755, y - 18, { size: 12, family: F.mono, color: C.coral, align: "center", alpha: muteP });
  }

  // status pills
  const statusP = smooth(span(lt, s1 + 0.6, s1 + 1.2));
  if (statusP > 0) {
    pill("sound off", 160, 860, C.coral, { alpha: statusP });
    pill("signal on", 340, 860, C.mint, { alpha: statusP });
    text("the instrument keeps breathing", 600, 866, { size: 22, family: F.sans, weight: 400, color: C.dim, alpha: statusP });
  }

  const lineP = smooth(span(lt, s2 - 0.2, s2 + 0.8));
  if (lineP > 0) {
    text("The visuals never lie, even in silence.", 110, 940, {
      size: 30,
      family: F.serif,
      style: "italic",
      color: C.ink,
      alpha: lineP,
    });
  }
}

// ---------------------------------------------------------------- orb

function orb(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 3;
  const s2 = s[2]?.start ?? 8;
  const s3 = s[3]?.start ?? 14;
  const s4 = s[4]?.start ?? 19;

  header("The stage");
  revealText("Two views", 110, 210, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1)), {
    size: 62,
    weight: 500,
    color: C.ink,
  });
  revealText("of one signal.", 110, 282, easeOut(span(lt, (s[0]?.start ?? 0) + 0.25, (s[0]?.start ?? 0) + 1.3)), {
    size: 72,
    family: F.serif,
    style: "italic",
    color: C.peach,
  });

  const dx = 850;
  const dy = 190;
  const dw = 960;
  const dh = 560;
  panel(dx - 7, dy - 7, dw + 14, dh + 14, { r: 20, fill: "rgba(8,10,22,0.35)", stroke: "rgba(244,241,234,0.12)" });
  image("stage", dx, dy, dw, dh, 1, 12);

  // callouts
  const timeP = smooth(span(lt, s1 - 0.2, s1 + 0.8));
  const freqP = smooth(span(lt, s2 - 0.2, s2 + 0.8));
  const calloutFade = 1 - smooth(span(lt, s3 - 0.3, s3 + 0.4));
  if (timeP > 0 && calloutFade > 0) {
    ring(1320, 460, 245, withAlpha(C.coral, 0.45), 1.2, timeP * calloutFade, [4, 9]);
    line(1020, 790, 1020, 758, withAlpha(C.coral, 0.4), 1.2, [4, 6], timeP * calloutFade);
    panel(880, 790, 280, 70, { r: 12, alpha: timeP * calloutFade, fill: "rgba(8,12,24,0.86)", stroke: withAlpha(C.coral, 0.3) });
    text("waveform ring", 902, 820, { size: 15, family: F.mono, color: C.coral, alpha: timeP * calloutFade });
    text("time domain", 902, 842, { size: 12, family: F.mono, color: C.dim, alpha: timeP * calloutFade });
  }
  if (freqP > 0 && calloutFade > 0) {
    for (let i = 0; i < 48; i++) {
      const a = -Math.PI * 0.42 + (i / 48) * Math.PI * 0.84;
      const r0 = 260;
      const r1 = 276 + Math.abs(Math.sin(i * 0.9 + lt * 2)) * 18;
      line(
        1320 + Math.cos(a) * r0,
        460 + Math.sin(a) * r0 * 0.92,
        1320 + Math.cos(a) * r1,
        460 + Math.sin(a) * r1 * 0.92,
        withAlpha(C.mint, 0.5),
        2,
        null,
        freqP * calloutFade,
      );
    }
    line(1360, 790, 1360, 758, withAlpha(C.mint, 0.4), 1.2, [4, 6], freqP * calloutFade);
    panel(1220, 790, 280, 70, { r: 12, alpha: freqP * calloutFade, fill: "rgba(8,12,24,0.86)", stroke: withAlpha(C.mint, 0.3) });
    text("spectrum ticks", 1242, 820, { size: 15, family: F.mono, color: C.mint, alpha: freqP * calloutFade });
    text("frequency domain", 1242, 842, { size: 12, family: F.mono, color: C.dim, alpha: freqP * calloutFade });
  }

  // time + frequency panels
  const panelsP = smooth(span(lt, s1 - 0.1, s1 + 0.8)) * (1 - smooth(span(lt, s3 - 0.5, s3 + 0.3)));
  if (panelsP > 0) {
    panel(110, 360, 680, 160, { r: 14, alpha: panelsP, fill: "rgba(8,12,24,0.72)", stroke: "rgba(244,241,234,0.1)" });
    label("TIME DOMAIN", 134, 392, { alpha: panelsP, size: 13, color: C.coral });
    text("2048 samples", 766, 392, { size: 13, family: F.mono, color: C.dim, align: "right", alpha: panelsP });
    ctx.save();
    ctx.globalAlpha *= panelsP;
    ctx.beginPath();
    ctx.rect(110, 402, 680, 110);
    ctx.clip();
    drawWaveforms(116, 402, 668, 110, lt, C.coral, 0.9);
    ctx.restore();
    // frame bracket
    const bx = 700;
    line(bx, 408, bx, 506, withAlpha(C.mint, 0.4), 1, null, panelsP);
    text("one frame", bx + 12, 430, { size: 12, family: F.mono, color: C.mint, alpha: panelsP });

    const fP = smooth(span(lt, s2 - 0.2, s2 + 0.8));
    panel(110, 550, 680, 180, { r: 14, alpha: fP, fill: "rgba(8,12,24,0.72)", stroke: "rgba(244,241,234,0.1)" });
    label("FREQUENCY DOMAIN", 134, 582, { alpha: fP, size: 13, color: C.mint });
    const bars = 42;
    const bw = 12;
    const gap = 4;
    for (let i = 0; i < bars; i++) {
      const p = i / bars;
      const env = Math.exp(-Math.pow((p - 0.18) * 2.4, 2)) * 0.7 + Math.exp(-Math.pow((p - 0.55) * 3, 2)) * 0.35 + 0.08;
      const v = env * (0.7 + 0.3 * Math.sin(lt * 2 + i * 0.8));
      const bh = 12 + v * 100;
      const x = 134 + i * (bw + gap);
      ctx.fillStyle = withAlpha(i < 14 ? C.peach : i < 30 ? C.coral : C.mint, 0.72 * fP);
      rrect(x, 690 - bh, bw, bh, 3);
      ctx.fill();
    }
    text("bass", 134, 724, { size: 11, family: F.mono, color: C.dim, alpha: fP });
    text("treble", 740, 724, { size: 11, family: F.mono, color: C.dim, align: "right", alpha: fP });
  }

  // springs
  const springP = smooth(span(lt, s3 - 0.2, s3 + 0.7));
  if (springP > 0) {
    const rows = [
      { name: "LEVEL", d: 7.5, w: 13, color: C.coral, delay: 0 },
      { name: "BASS", d: 5.5, w: 9, color: C.peach, delay: 0.25 },
      { name: "TREBLE", d: 9, w: 16, color: C.mint, delay: 0.5 },
    ];
    const t0 = s3 + 0.2;
    rows.forEach((row, i) => {
      const yy = 390 + i * 100;
      const tt = Math.max(0, lt - t0 - row.delay);
      const env = Math.exp(-row.d * tt * 0.5);
      const resp = 1 - env * (Math.cos(row.w * tt) + (row.d / row.w) * Math.sin(row.w * tt));
      const x0 = 190;
      const targetX = 650;
      const massX = x0 + (targetX - x0) * clamp(resp, -0.15, 1.25);
      label(row.name, 110, yy + 6, { alpha: springP, size: 14 });
      line(x0, yy, targetX + 20, yy, "rgba(244,241,234,0.1)", 1, [4, 8], springP);
      line(targetX, yy - 26, targetX, yy + 26, withAlpha(row.color, 0.5), 1.2, null, springP);
      ctx.save();
      ctx.globalAlpha *= springP;
      ctx.strokeStyle = withAlpha(row.color, 0.6);
      ctx.lineWidth = 1.8;
      springPath(x0, massX - 18, yy, 11, 13);
      ctx.stroke();
      ctx.restore();
      dot(massX, yy, 17, row.color, springP, 18);
      text(`${row.d}`, 760, yy + 5, { size: 12, family: F.mono, color: C.dim, alpha: springP });
      text(`ω ${row.w}`, 810, yy + 5, { size: 12, family: F.mono, color: C.dim, alpha: springP });
    });
    text("m x'' + c x' + k x = target", 110, 745, {
      size: 18,
      family: F.mono,
      color: C.dim,
      alpha: springP,
    });
    text("smoothing, not measurement", 110, 780, {
      size: 18,
      family: F.mono,
      color: C.mint,
      alpha: springP,
    });
  }

  const endP = smooth(span(lt, s4 - 0.2, s4 + 0.8));
  if (endP > 0) {
    text("It settles, instead of twitching.", 110, 900, {
      size: 30,
      family: F.serif,
      style: "italic",
      color: C.ink,
      alpha: endP,
    });
  }
}

// ---------------------------------------------------------------- clock

function clockScene(lt, sc) {
  const s = times(sc);
  const s2 = s[2]?.start ?? 6;

  header("The clock");

  // note pills
  const notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
  const step = Math.floor((lt - (s[1]?.start ?? 2)) * 3.333333) % 8;
  panel(110, 180, 430, 610, { r: 16, fill: "rgba(8,12,24,0.66)", stroke: "rgba(244,241,234,0.1)" });
  label("ARP · UP · 1/8", 138, 218, { size: 13, color: C.peach });
  text("100 BPM", 512, 218, { size: 13, family: F.mono, color: C.dim, align: "right" });
  notes.forEach((n, i) => {
    const active = i === step;
    const y = 248 + i * 60;
    rrect(134, y, 382, 48, 9);
    ctx.fillStyle = active ? withAlpha(C.coral, 0.22) : "rgba(244,241,234,0.035)";
    ctx.fill();
    ctx.strokeStyle = active ? withAlpha(C.coral, 0.6) : "rgba(244,241,234,0.07)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    dot(156, y + 24, 4, active ? C.coral : C.faint, 1, active ? 8 : 0);
    text(n, 176, y + 31, { size: 16, family: F.mono, color: active ? C.ink : C.dim });
    text(`0${i + 1}`, 498, y + 31, { size: 13, family: F.mono, color: C.faint, align: "right" });
  });

  // timeline
  const px = 600;
  const py = 180;
  const pw = 1210;
  const ph = 300;
  panel(px, py, pw, ph, { r: 16, fill: "rgba(8,12,24,0.66)", stroke: "rgba(244,241,234,0.1)" });
  label("SCHEDULER", px + 28, py + 38, { size: 13, color: C.mint });
  text("AudioContext.currentTime", px + pw - 28, py + 38, { size: 13, family: F.mono, color: C.dim, align: "right" });

  const gx = px + 50;
  const gw = pw - 100;
  const ty = py + 160;
  const beatW = gw / 4;
  const phase = (((lt - (s[0]?.start ?? 0)) / 2.4) % 1 + 1) % 1;
  const nowX = gx + phase * gw;
  for (let i = 0; i <= 16; i++) {
    const x = gx + (i / 16) * gw;
    const major = i % 4 === 0;
    line(x, ty - 30, x, ty + 30, major ? "rgba(244,241,234,0.2)" : "rgba(244,241,234,0.07)", 1);
    if (major) text(String(i / 4 + 1), x, ty + 54, { size: 12, family: F.mono, color: C.faint, align: "center" });
  }
  line(gx, ty, gx + gw, ty, "rgba(244,241,234,0.18)", 1.4);

  // lookahead window
  const laW = (0.12 / 0.6) * beatW;
  const windowP = smooth(span(lt, s2 - 0.3, s2 + 0.7));
  if (windowP > 0) {
    rrect(nowX, ty - 54, laW, 108, 6);
    ctx.fillStyle = withAlpha(C.mint, 0.18 * windowP);
    ctx.fill();
    ctx.strokeStyle = withAlpha(C.mint, 0.7 * windowP);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    line(nowX + laW, ty - 70, nowX + laW, ty + 60, withAlpha(C.mint, 0.4), 1, [3, 5], windowP);
    line(nowX, ty - 66, nowX, ty - 58, withAlpha(C.mint, 0.6), 1.2, null, windowP);
    line(nowX + laW, ty - 66, nowX + laW, ty - 58, withAlpha(C.mint, 0.6), 1.2, null, windowP);
    line(nowX, ty - 66, nowX + laW, ty - 66, withAlpha(C.mint, 0.5), 1.2, null, windowP);
    line(nowX + laW / 2, ty - 86, nowX + laW / 2, ty - 68, withAlpha(C.mint, 0.4), 1, null, windowP);
    text("120 ms", nowX + laW / 2, ty - 92, { size: 13, family: F.mono, color: C.mint, align: "center", alpha: windowP });
  }

  // notes on the timeline
  for (let i = -2; i < 12; i++) {
    const x = nowX + i * (beatW / 2);
    if (x < gx - 30 || x > gx + gw + 30) continue;
    const inWindow = x >= nowX && x <= nowX + laW;
    const bh = 22 + (i % 3) * 7;
    rrect(x, ty - 10 - bh / 2, 9, bh, 4);
    ctx.fillStyle = inWindow ? C.mint : withAlpha(C.peach, 0.5);
    ctx.fill();
    if (inWindow) {
      ctx.save();
      ctx.shadowColor = C.mint;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
    }
  }

  // playhead
  line(nowX, ty - 70, nowX, ty + 62, C.coral, 2);
  dot(nowX, ty - 70, 4, C.coral, 1, 10);

  // magnified lookahead
  const zy = 520;
  const zh = 255;
  if (windowP > 0) {
    panel(px, zy, pw, zh, { r: 16, alpha: windowP, fill: "rgba(8,12,24,0.7)", stroke: withAlpha(C.mint, 0.16) });
    label("120 MILLISECONDS, MAGNIFIED", px + 28, zy + 38, { size: 13, color: C.mint, alpha: windowP });
    const zx0 = px + 90;
    const zx1 = px + pw - 100;
    const zNow = zx0 + 80;
    const laneY = zy + 142;
    rrect(zNow, laneY - 46, zx1 - zNow, 92, 8);
    ctx.fillStyle = withAlpha(C.mint, 0.09 * windowP);
    ctx.fill();
    ctx.strokeStyle = withAlpha(C.mint, 0.35 * windowP);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    line(zx0, laneY, zx1, laneY, "rgba(244,241,234,0.14)", 1.2, null, windowP);
    line(zNow, laneY - 56, zNow, laneY + 56, C.coral, 2, null, windowP);
    line(zx1, laneY - 50, zx1, laneY + 50, withAlpha(C.mint, 0.5), 1.2, null, windowP);
    text("now", zNow, laneY - 66, { size: 12, family: F.mono, color: C.coral, align: "center", alpha: windowP });
    text("+120 ms", zx1, laneY - 66, { size: 12, family: F.mono, color: C.mint, align: "right", alpha: windowP });
    const scroll = (lt * 95) % 150;
    for (let i = 0; i < 8; i++) {
      const x = zx1 + 40 - i * 150 - scroll;
      if (x < zx0 - 20 || x > zx1 + 8) continue;
      const committed = x <= zNow;
      rrect(x, laneY - 26, 16, 52, 5);
      ctx.fillStyle = committed ? withAlpha(C.mint, 0.9 * windowP) : withAlpha(C.peach, 0.5 * windowP);
      ctx.fill();
    }
    text("scheduled before it is heard", zNow + 20, zy + 224, { size: 13, family: F.mono, color: C.mint, alpha: windowP });
    text("the frame can stall here", zx1, zy + 224, { size: 13, family: F.mono, color: C.dim, align: "right", alpha: windowP });
  }

  // code
  const codeP = smooth(span(lt, s2 + 0.2, s2 + 1));
  codeCard(
    ["const LOOKAHEAD_SECONDS = 0.12;", "const TICK_MS = 28;", "", "// schedule real notes ahead", "// visuals can be late. audio can't."],
    110,
    830,
    430,
    { alpha: codeP, size: 15 },
  );
}

// ---------------------------------------------------------------- demo

function demo(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 4;
  const s2 = s[2]?.start ?? 10;
  const s3 = s[3]?.start ?? 14;

  header("The demo");
  revealText("First Light is data.", 110, 200, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1)), {
    size: 56,
    weight: 500,
    color: C.ink,
  });
  text("48 beats · 83 note events · one instrument", 110, 242, {
    size: 16,
    family: F.mono,
    color: C.dim,
    alpha: smooth(span(lt, (s[0]?.start ?? 0) + 0.6, (s[0]?.start ?? 0) + 1.4)),
  });

  // data card
  const cardP = smooth(span(lt, s1 - 0.2, s1 + 0.8));
  if (cardP > 0) {
    codeCard(
      ["// [beat, note, length, velocity]", "[ 0,  A3, 7.4, 0.46 ]", "[ 8,  E3, 0.42, 0.34 ]", "[44,  C3, 4.0, 0.50 ]"],
      1370,
      110,
      350,
      { alpha: cardP, size: 15, accent: C.peach, title: "DEMO_NOTES" },
    );
  }

  const rollX = 110;
  const rollY = 390;
  const rollW = 1700;
  const rollH = 360;
  const beatW = rollW / 48;
  const notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4"];
  const rowH = rollH / notes.length;

  // roll frame + grid
  panel(rollX, rollY, rollW, rollH, { r: 10, fill: "rgba(8,12,24,0.55)", stroke: "rgba(244,241,234,0.08)" });
  for (let b = 0; b <= 48; b++) {
    const x = rollX + b * beatW;
    const bar = b % 4 === 0;
    line(x, rollY, x, rollY + rollH, bar ? "rgba(244,241,234,0.13)" : "rgba(244,241,234,0.035)", 1);
    if (bar && b < 48) {
      text(`${b / 4 + 1}`, x + 6, rollY + 16, { size: 10, family: F.mono, color: C.faint });
    }
  }
  notes.forEach((n, i) => {
    const y = rollY + rollH - (i + 1) * rowH;
    line(rollX, y, rollX + rollW, y, "rgba(244,241,234,0.035)", 1);
    text(n, rollX - 12, y + rowH * 0.7, { size: 12, family: F.mono, color: C.faint, align: "right" });
  });

  const playStart = (s[0]?.start ?? 0) + 1.2;
  const sweep = Math.max(1, sc.end - sc.start - 2);
  const autoBeat = clamp(((lt - playStart) / sweep) * 48, 0, 48);
  const grabStart = (s[2]?.start ?? 9) + 2.8;
  const grab = smooth(span(lt, grabStart, grabStart + 1));
  const beat = autoBeat;
  const playX = rollX + beat * beatW;

  // filter curve
  const fTop = 275;
  const fBot = 355;
  const toY = (v) => fBot - (v / 100) * (fBot - fTop);
  const pts = DEMO_FILTER.map(([b, v]) => [rollX + (b / 48) * rollW, toY(v)]);
  const curveP = smooth(span(lt, s2 - 0.3, s2 + 0.8));
  if (curveP > 0) {
    label("FILTER RIDE", 620, 242, { size: 12, color: C.peach, alpha: curveP });
    text("22 → 82 → 34", 750, 242, { size: 12, family: F.mono, color: C.dim, alpha: curveP });
    curve(pts, withAlpha(C.peach, 0.22), 1.4, curveP);
    // bright portion up to playhead
    const upto = pts.filter((p) => p[0] <= playX);
    if (upto.length > 1) curve(upto, C.peach, 2.4, curveP);
    const fv = filterAt(beat);
    dot(playX, toY(fv), 6, C.peach, curveP, 14);
    text(`${Math.round(fv)}%`, playX + 12, toY(fv) - 12, { size: 12, family: F.mono, color: C.peach, alpha: curveP });
  }

  // notes
  DEMO.forEach((n) => {
    const idx = notes.indexOf(n.name);
    if (idx < 0) return;
    const x = rollX + (n.beat / 48) * rollW;
    const w = Math.max(3, (n.len / 48) * rollW - 1.5);
    const y = rollY + rollH - (idx + 1) * rowH + 5;
    const played = n.beat <= beat;
    const isMelody = n.name === "D4" || n.name === "E4";
    const isBass = ["C3", "D3", "E3", "F3", "G3"].includes(n.name);
    const col = isMelody ? C.coral : isBass ? C.mint : C.peach;
    const a = played ? 0.92 : 0.2;
    ctx.save();
    ctx.globalAlpha *= a;
    if (played && playX - x < 90) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 16;
    }
    rrect(x, y, w, rowH - 9, 4);
    ctx.fillStyle = withAlpha(col.startsWith("#") ? col : C.peach, 0.9);
    ctx.fill();
    ctx.restore();
  });

  // playhead
  line(playX, rollY - 6, playX, rollY + rollH, withAlpha(C.coral, 0.8), 1.6);
  dot(playX, rollY - 6, 4, C.coral, 1, 10);

  // sections
  const sections = [
    [0, 8, "IGNITION"],
    [8, 24, "PULSE"],
    [24, 40, "LIFT"],
    [40, 44, "BREATH"],
    [44, 48, "RESOLVE"],
  ];
  sections.forEach(([b0, b1, nm], i) => {
    const x0 = rollX + (b0 / 48) * rollW;
    const x1 = rollX + (b1 / 48) * rollW;
    if (i > 0) line(x0, rollY, x0, rollY + rollH + 10, withAlpha(C.mint, 0.25), 1, [3, 6]);
    text(nm, x0 + 8, rollY + rollH + 30, { size: 11, family: F.mono, color: b0 <= beat ? C.mint : C.faint, ls: 2 });
  });

  // hand control
  const grabP = grab;
  if (grabP > 0) {
    const fv = filterAt(beat);
    const gx = playX;
    const gy = toY(fv);
    ring(gx, gy, 18, withAlpha(C.mint, 0.6), 1.4, grabP);
    // cursor
    ctx.save();
    ctx.globalAlpha *= grabP;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(gx + 18, gy + 10);
    ctx.lineTo(gx + 34, gy + 46);
    ctx.lineTo(gx + 24, gy + 44);
    ctx.lineTo(gx + 18, gy + 58);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const cardX = gx > 1500 ? gx - 260 : gx + 60;
    panel(cardX, gy + 16, 190, 58, { r: 10, alpha: grabP, fill: "rgba(8,12,24,0.9)", stroke: withAlpha(C.mint, 0.35) });
    text("you take over", cardX + 18, gy + 42, { size: 14, family: F.mono, color: C.mint, alpha: grabP });
    text("filter released", cardX + 18, gy + 62, { size: 12, family: F.mono, color: C.dim, alpha: grabP });
    // dashed future
    const future = pts.filter((p) => p[0] >= playX);
    if (future.length > 1) curve(future, withAlpha(C.mint, 0.4), 1.6, grabP, [5, 7]);
  }
}

// ---------------------------------------------------------------- presets

function presets(lt, sc) {
  const s = times(sc);
  const s2 = s[2]?.start ?? 12;

  header("Five moods");
  revealText("Same engine.", 110, 200, easeOut(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 0.9)), {
    size: 54,
    weight: 500,
    color: C.ink,
  });
  revealText("Different weather.", 110, 268, easeOut(span(lt, (s[0]?.start ?? 0) + 0.3, (s[0]?.start ?? 0) + 1.3)), {
    size: 64,
    family: F.serif,
    style: "italic",
    color: C.peach,
  });

  const order = ["bloom", "glass", "tape", "haze", "pulse"];
  const spoken = ["glass", "tape", "haze", "pulse", "bloom"];
  const cols = [196, 578, 960, 1342, 1724];
  const cy = 550;

  order.forEach((key, i) => {
    const pal = PALETTES[key];
    const names = { bloom: "BLOOM", glass: "GLASS", tape: "TAPE", haze: "HAZE", pulse: "PULSE" };
    const motionWord = { bloom: "breathes", glass: "shimmers", tape: "drags", haze: "drifts", pulse: "snaps" };
    const spokenIndex = spoken.indexOf(key);
    const lit = smooth(span(lt, s2 + 0.2 + spokenIndex * 0.5, s2 + 0.7 + spokenIndex * 0.5));
    const baseA = 0.62 + 0.38 * lit;
    let breathe = 1;
    let mx = 0;
    let my = 0;
    if (key === "bloom") breathe = 1 + Math.sin(lt * 0.9) * 0.06;
    if (key === "glass") breathe = 1 + Math.sin(lt * 5.2) * 0.025;
    if (key === "tape") breathe = 1 + Math.sin(lt * 0.55) * 0.04;
    if (key === "haze") {
      breathe = 1 + Math.sin(lt * 0.4) * 0.03;
      mx = Math.sin(lt * 0.35 + 1) * 10;
      my = Math.cos(lt * 0.28) * 8;
    }
    if (key === "pulse") {
      const ph = (lt % 0.75) / 0.75;
      breathe = 1 + Math.exp(-ph * 9) * 0.12;
    }
    const x = cols[i] + mx;
    const y = cy + my;
    drawOrb(x, y, 104, pal, lt, { speed: key === "glass" ? 1.6 : key === "tape" ? 0.7 : key === "haze" ? 0.5 : key === "pulse" ? 1.95 : 1, wobble: key === "haze" ? 1.75 : 1, halo: key === "haze" ? 1.35 : 1 }, { alpha: baseA, breathe });
    if (key === "glass") {
      for (let k = 0; k < 3; k++) {
        ctx.save();
        ctx.globalAlpha *= 0.5 * baseA;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 7]);
        ctx.beginPath();
        ctx.arc(x, y, 124 + k * 11, -1.1 + lt * 1.7 + k, 0.5 + lt * 1.7 + k);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (key === "tape") {
      ctx.save();
      ctx.globalAlpha *= 0.38 * baseA;
      ctx.strokeStyle = pal.secondary;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 126, 110, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (key === "haze") {
      glow(x, y, 230, pal.accent, 0.12 * baseA);
      for (let k = 0; k < 7; k++) {
        const a = lt * 0.2 + k * 0.9;
        dot(x + Math.cos(a) * (152 + k * 5), y + Math.sin(a * 1.3) * (126 + k * 6), 1.7, pal.accent, 0.32 * baseA);
      }
    }
    if (key === "pulse") {
      const ph = (lt % 0.75) / 0.75;
      ring(x, y, 122 + ph * 72, withAlpha(pal.secondary, 0.65 * (1 - ph) * baseA), 1.6, baseA);
    }
    ring(x, y, 136, withAlpha(pal.accent, 0.26 * baseA), 1, baseA, [3, 8]);
    text(names[key], x, 716, { size: 18, family: F.mono, color: lit > 0.5 ? C.ink : C.dim, ls: 3, align: "center", alpha: 0.6 + 0.4 * lit });
    text(motionWord[key], x, 760, { size: 32, family: F.serif, style: "italic", color: pal.accent, align: "center", alpha: 0.5 + 0.5 * lit });
  });

  // engine line
  const lineP = smooth(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1.5));
  line(110, 850, 1810, 850, "rgba(244,241,234,0.1)", 1, null, lineP);
  text("oscillators · filter · envelope · delay · reverb", 960, 888, {
    size: 16,
    family: F.mono,
    color: C.dim,
    ls: 2,
    align: "center",
    alpha: lineP,
  });
  text("one voice engine", 960, 918, {
    size: 15,
    family: F.mono,
    color: C.mint,
    ls: 2,
    align: "center",
    alpha: lineP,
  });
}

// ---------------------------------------------------------------- close

function close(lt, sc) {
  const s = times(sc);
  const s1 = s[1]?.start ?? 5;
  const s2 = s[2]?.start ?? 9;
  const s3 = s[3]?.start ?? 13;

  header("The instrument");

  const stats = [
    { num: "0", lab: "audio files", note: "every sound is synthesized", color: C.peach },
    { num: "0", lab: "runtime libraries", note: "no framework, no audio lib", color: C.mint },
    { num: "0", lab: "backend", note: "static files on GitHub Pages", color: C.cyan },
    { num: "8", lab: "voices", note: "three oscillators each", color: C.coral },
  ];
  const statsP = smooth(span(lt, s[0]?.start ?? 0, (s[0]?.start ?? 0) + 1.2));
  const statsOut = 1 - smooth(span(lt, s2 - 0.5, s2 + 0.4));
  if (statsP > 0) {
    stats.forEach((st, i) => {
      const x = 205 + i * 384;
      const y = 310;
      const p = easeOut(span(lt, (s[0]?.start ?? 0) + 0.2 + i * 0.18, (s[0]?.start ?? 0) + 0.9 + i * 0.18));
      panel(x, y, 360, 190, { r: 14, alpha: p * statsOut, fill: "rgba(10,14,28,0.6)", stroke: "rgba(244,241,234,0.1)" });
      line(x + 24, y + 22, x + 86, y + 22, withAlpha(st.color, 0.8), 2, null, p * statsOut);
      text(st.num, x + 26, y + 100, { size: 86, weight: 500, color: i === 3 ? C.coral : C.ink, alpha: p * statsOut });
      text(st.lab, x + 26, y + 132, { size: 15, family: F.mono, color: C.dim, ls: 2, alpha: p * statsOut });
      text(st.note, x + 26, y + 162, { size: 14, family: F.sans, color: "rgba(244,241,234,0.4)", alpha: p * statsOut });
    });
    revealText("A small instrument.", 110, 220, easeOut(span(lt, (s[0]?.start ?? 0) + 0.4, (s[0]?.start ?? 0) + 1.4)), {
      size: 54,
      weight: 500,
      color: C.ink,
      alpha: statsOut,
    });
    const buildP = smooth(span(lt, (s[0]?.start ?? 0) + 1.0, (s[0]?.start ?? 0) + 1.9)) * statsOut;
    label("BUILT WITH", 205, 574, { size: 13, alpha: buildP });
    text("TypeScript  ·  Canvas 2D  ·  Web Audio API", 205, 612, {
      size: 24,
      family: F.mono,
      color: C.mint,
      alpha: buildP,
    });
    text("Vite, TypeScript and Vitest are dev-only. The deployed output is static.", 205, 656, {
      size: 17,
      family: F.sans,
      color: C.dim,
      alpha: buildP * 0.8,
    });
  }

  // warmth behind the closing card, no hard frame
  const appP = smooth(span(lt, s2 - 0.3, s2 + 1));
  if (appP > 0) {
    glow(1480, 430, 500, C.coral, 0.09 * appP);
  }

  // end card
  const endP = smooth(span(lt, s2 + 0.2, s2 + 1.3));
  if (endP > 0) {
    const rise = (1 - endP) * 20;
    const shade = ctx.createRadialGradient(960, 560, 120, 960, 560, 760);
    shade.addColorStop(0, `rgba(7,10,21,${0.82 * endP})`);
    shade.addColorStop(0.55, `rgba(7,10,21,${0.6 * endP})`);
    shade.addColorStop(1, "rgba(7,10,21,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(260, 160, 1400, 800);
    drawWordmark(960, 470 + rise, 1.65, endP, true);
    revealText("Make some noise.", 960, 650 + rise, easeOut(span(lt, s2 + 0.6, s2 + 1.8)), {
      size: 104,
      family: F.serif,
      style: "italic",
      color: C.coral,
      align: "center",
      alpha: endP,
    });
    text("jimmerioles.github.io/wave", 960, 742 + rise, {
      size: 20,
      family: F.mono,
      color: C.mint,
      ls: 3,
      align: "center",
      alpha: endP,
    });
    text("A playable synthesizer · Prototype no. 01", 960, 786 + rise, {
      size: 15,
      family: F.mono,
      color: C.dim,
      ls: 2,
      align: "center",
      alpha: endP,
    });
    // key burst
    const burst = smooth(span(lt, s3 - 0.2, s3 + 0.8));
    if (burst > 0) {
      for (let i = 0; i < 3; i++) {
        ring(960, 470 + rise, 220 + i * 42 + Math.sin(lt * 1.2 + i) * 6, withAlpha(i % 2 ? C.mint : C.coral, 0.12 * burst), 1, burst, [2, 10]);
      }
    }
  }
}

export const SCENES = {
  intro,
  thesis,
  voice,
  chain,
  mute,
  orb,
  clock: clockScene,
  demo,
  presets,
  close,
};
