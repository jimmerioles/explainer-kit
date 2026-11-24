// Scenes for "explainer-kit, explained".
// Each key matches a segment id in script.json. The kit supplies the frame,
// the fade, the chapter counter and the type system. This file supplies the
// argument.

import {
  W,
  H,
  M,
  ctx,
  C,
  F,
  clamp,
  lerp,
  smooth,
  easeOut,
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
  drawWaveforms,
  sceneLabel,
} from "/kit/render/helpers.js";

const T = {
  display: 96,
  title: 64,
  body: 32,
  caption: 24,
  label: 18,
  chrome: 14,
};

// The one sentence this film follows. It is the Wave fixture's line.
const SENTENCE_1 = "You hold the A key,";
const SENTENCE_2 = "and a voice wakes up.";
const SENTENCE_HASH = "8db55cc89c50ff83e0bfdf03";

const WAVE_CHAPTERS = [
  [1.2, "Cold open"],
  [23.165, "The signal"],
  [41.51, "One voice"],
  [67.65, "The shared chain"],
  [92.165, "The quiet trick"],
  [107.66, "Two views"],
  [129.275, "The clock"],
  [146.645, "First Light is data"],
  [163.065, "Five moods"],
  [179.66, "A small instrument"],
];
const WAVE_DURATION = 200.815;

function times(sc) {
  return sc.seg.sentences.map((s) => ({
    start: s.start - sc.start,
    end: s.end - sc.start,
    dur: s.duration,
  }));
}

function head(sc, lt) {
  const dur = sc.end - sc.start;
  const p = smooth(span(lt, 0.45, 0.8)) * (1 - smooth(span(lt, dur - 0.55, dur - 0.15)));
  sceneLabel(sc.seg.title ?? sc.id, M.x, M.top, p);
}

function codeCard(lines, x, y, w, opts = {}) {
  const {
    size = T.label,
    lh = 1.65,
    title = null,
    accent = C.mint,
    alpha = 1,
    fill = "rgba(8,12,24,0.78)",
    stroke = "rgba(244,241,234,0.10)",
    r = 14,
  } = opts;
  const lineH = size * lh;
  const padTop = title ? 54 : 28;
  const h = lines.length * lineH + padTop + 10;
  panel(x, y, w, h, { r, fill, stroke, alpha });
  if (title) label(title, x + 22, y + 32, { size: T.chrome, alpha });
  lines.forEach((ln, i) => {
    const entry = typeof ln === "string" ? { t: ln } : ln;
    const color = entry.color ?? (entry.t.startsWith("//") ? C.faint : accent);
    text(entry.t, x + 22, y + padTop + i * lineH, {
      size,
      family: F.mono,
      color,
      alpha: alpha * (entry.alpha ?? 1),
    });
  });
  return h;
}

function pill(str, x, y, color = C.mint, opts = {}) {
  const { size = T.chrome, alpha = 1, align = "left", fill = true } = opts;
  font(size, 400, F.mono);
  ctx.letterSpacing = "2px";
  const w = ctx.measureText(str.toUpperCase()).width + 26;
  const px = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const h = size + 16;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (fill) {
    rrect(px, y - size - 7, w, h, 999);
    ctx.fillStyle = withAlpha(color, 0.1);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  text(str.toUpperCase(), px + 13, y, { size, family: F.mono, color, ls: 2 });
  ctx.restore();
  return w;
}

function check(x, y, p, color = C.mint) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= p;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x + 9, y - 7);
  ctx.stroke();
  ctx.restore();
}

function cross(x, y, p, color = C.coral) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= p;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 7);
  ctx.lineTo(x + 7, y + 7);
  ctx.moveTo(x + 7, y - 7);
  ctx.lineTo(x - 7, y + 7);
  ctx.stroke();
  ctx.restore();
}

function sentenceCard(x, y, w, h, alpha, opts = {}) {
  const { size = T.title, color = C.ink, labelText = "ONE SENTENCE", labelAlpha = 1 } = opts;
  panel(x, y, w, h, {
    r: 18,
    alpha,
    fill: "rgba(10,14,28,0.66)",
    stroke: withAlpha(C.coral, 0.28),
  });
  label(labelText, x + 28, y + 38, { size: T.chrome, color: C.coral, alpha: alpha * labelAlpha });
  text(SENTENCE_1, x + 28, y + h * 0.56, {
    size,
    family: F.serif,
    style: "italic",
    color,
    alpha,
  });
  text(SENTENCE_2, x + 28, y + h * 0.56 + size * 1.08, {
    size,
    family: F.serif,
    style: "italic",
    color,
    alpha,
  });
}

// ---------------------------------------------------------------- intro

function intro(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const frameP = easeOut(span(lt, s0, s0 + 1.1));
  const fx = 980;
  const fy = 196;
  const fw = 800;
  const fh = 450;

  if (frameP > 0) {
    ctx.save();
    ctx.globalAlpha *= frameP;
    glow(fx + fw / 2, fy + fh / 2, fw * 0.62, C.coral, 0.16);
    panel(fx - 7, fy - 7, fw + 14, fh + 14, {
      r: 20,
      fill: "rgba(8,10,22,0.4)",
      stroke: "rgba(244,241,234,0.14)",
      glow: withAlpha(C.coral, 0.18),
    });
    image("poster", fx, fy, fw, fh, 1, 12);
    ctx.restore();
    label("WAVE / A FINISHED FILM", fx, fy - 22, { size: T.chrome, color: C.dim, alpha: frameP });
    text("200.815s · 1920x1080 · 30 fps", fx + fw, fy - 22, {
      size: T.chrome,
      family: F.mono,
      color: C.faint,
      align: "right",
      alpha: frameP,
    });
  }

  // one sentence, left
  const sentP = easeOut(span(lt, s1, s1 + 1.0));
  if (sentP > 0) {
    sentenceCard(110, 196, 760, 250, sentP, { size: T.title });
    text("docs/explainer/script.json", 138, 462, {
      size: T.chrome,
      family: F.mono,
      color: C.faint,
      alpha: sentP * (1 - smooth(span(lt, s3 - 0.3, s3 + 0.2))),
    });
  }

  const chainP = 1 - smooth(span(lt, s3 - 0.7, s3 - 0.1));
  if (chainP > 0) {
    const rows = [
      ["01", "SCRIPT", "one sentence per beat"],
      ["02", "VOICE", "one house voice"],
      ["03", "TIMELINE", "each line, measured"],
      ["04", "RENDER", "30 frames a second"],
      ["05", "MIX", "-16 LUFS"],
      ["06", "VERIFY", "the gates"],
    ];
    const x = 110;
    const w = 475;
    const y0 = 500;
    const rowH = 54;
    const gap = 12;
    rows.forEach((row, i) => {
      const start = s2 + 0.15 + i * 0.78;
      const p = easeOut(span(lt, start, start + 0.65)) * chainP;
      if (p <= 0) return;
      const y = y0 + i * (rowH + gap);
      panel(x, y, w, rowH, {
        r: 10,
        alpha: p,
        fill: "rgba(10,14,28,0.7)",
        stroke: i === 5 ? withAlpha(C.coral, 0.4) : "rgba(244,241,234,0.1)",
      });
      text(row[0], x + 18, y + 33, { size: T.chrome, family: F.mono, color: C.coral, alpha: p });
      text(row[1], x + 64, y + 33, { size: T.label, family: F.mono, color: C.ink, ls: 2, alpha: p });
      text(row[2], x + w - 20, y + 33, {
        size: T.chrome,
        family: F.mono,
        color: C.dim,
        align: "right",
        alpha: p,
      });
      if (i < rows.length - 1) {
        line(x + 28, y + rowH, x + 28, y + rowH + gap, withAlpha(C.mint, 0.3), 1.2, null, p);
      }
    });
    const arrowP = smooth(span(lt, s2 + 4.9, s2 + 5.8)) * chainP;
    if (arrowP > 0) {
      arrow(
        x + w + 12,
        y0 + 5 * (rowH + gap) + rowH / 2,
        fx - 22,
        fy + fh / 2,
        withAlpha(C.coral, 0.55),
        1.4,
        9,
        arrowP,
      );
      text("one film", 790, 848, {
        size: T.chrome,
        family: F.mono,
        color: C.coral,
        alpha: arrowP,
      });
    }
  }

  // thesis
  const thesisP = smooth(span(lt, s3, s3 + 0.9));
  if (thesisP > 0) {
    text("A one-off film is a memory.", 110, 500, {
      size: T.title,
      weight: 500,
      color: C.ink,
      alpha: thesisP,
    });
    text("A series is a system.", 110, 590, {
      size: T.title,
      weight: 500,
      color: C.coral,
      alpha: thesisP,
    });
    line(110, 630, 110 + 370 * thesisP, 630, withAlpha(C.coral, 0.5), 1.4);
  }
}

// ---------------------------------------------------------------- layers

function layers(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const bands = [
    {
      n: "01",
      name: "MACHINE",
      where: "explainer-kit",
      color: C.coral,
      on: s0,
      files: "bin/explainer.mjs · src/render · src/mix · src/master · src/verify",
      sub: "1920x1080 · 30 fps · H.264 CRF 19 · -16.0 LUFS",
      tag: "NUMBERS LIVE HERE",
    },
    {
      n: "02",
      name: "BRAIN",
      where: "the skill",
      color: C.mint,
      on: s1,
      files: "skill/SKILL.md",
      sub: "doctor → narrate → stills → render → mix → master → verify",
      tag: "PROCEDURE LIVES HERE",
    },
    {
      n: "03",
      name: "CONTENT",
      where: "the project",
      color: C.peach,
      on: s2,
      files: "script.json · scenes.js · assets.js · music.m4a",
      sub: "docs/explainer/ · one project, one film",
      tag: "CONTENT LIVES HERE",
    },
  ];

  bands.forEach((b, i) => {
    const y = 196 + i * 222;
    const h = 184;
    const p = easeOut(span(lt, b.on, b.on + 0.9));
    const nextOn = i < 2 ? bands[i + 1].on : Infinity;
    const dim = 1 - 0.55 * smooth(span(lt, nextOn, nextOn + 0.8));
    const a = Math.max(0.45, dim) * p;
    panel(110, y, 1700, h, {
      r: 16,
      alpha: a,
      fill: "rgba(10,14,28,0.62)",
      stroke: withAlpha(b.color, i === 2 ? 0.28 : 0.2),
      glow: p > 0.5 ? withAlpha(b.color, 0.08) : null,
    });
    rrect(110, y, 6, h, 3);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.restore();

    text(b.n, 140, y + 54, { size: T.chrome, family: F.mono, color: b.color, alpha: a });
    text(b.name, 140, y + 92, { size: T.caption, family: F.mono, color: C.ink, ls: 2.4, alpha: a });
    text(b.where, 140, y + 122, { size: T.chrome, family: F.mono, color: C.dim, alpha: a });

    text(b.files, 430, y + 66, { size: T.label, family: F.mono, color: C.ink, alpha: a });
    text(b.sub, 430, y + 108, { size: T.chrome, family: F.mono, color: C.dim, alpha: a });

    const tagP = smooth(span(lt, s3 + 0.15 + i * 0.25, s3 + 0.8 + i * 0.25));
    if (tagP > 0) {
      text(b.tag, 1780, y + 150, {
        size: T.chrome,
        family: F.mono,
        color: b.color,
        align: "right",
        ls: 2,
        alpha: tagP * a,
      });
    }

    if (i < 2) {
      const by = y + h + 19;
      line(110, by, 1810, by, "rgba(244,241,234,0.12)", 1, [4, 10], Math.min(1, a + 0.2));
      text("BOUNDARY", 110, by - 6, { size: T.chrome, family: F.mono, color: C.faint, alpha: a });
    }
  });
}

// ---------------------------------------------------------------- init

function initScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const termX = 110;
  const termY = 196;
  const termW = 760;
  const termH = 280;
  panel(termX, termY, termW, termH, {
    r: 16,
    fill: "rgba(6,9,18,0.9)",
    stroke: "rgba(244,241,234,0.12)",
  });
  text("● ● ●", termX + 22, termY + 32, { size: T.chrome, family: F.mono, color: C.faint });
  text("terminal", termX + termW - 22, termY + 32, {
    size: T.chrome,
    family: F.mono,
    color: C.faint,
    align: "right",
  });
  line(termX, termY + 48, termX + termW, termY + 48, "rgba(244,241,234,0.08)", 1);

  const cmd = '$ explainer init --title "Cadence, explained"';
  const typed = Math.floor(cmd.length * clamp(span(lt, s0 + 0.1, s0 + 1.9), 0, 1));
  text(cmd.slice(0, typed), termX + 26, termY + 92, {
    size: T.label,
    family: F.mono,
    color: C.ink,
  });
  if (typed >= cmd.length && pulse(lt, 1.1) > 0.5) {
    font(T.label, 400, F.mono);
    rrect(termX + 26 + ctx.measureText(cmd).width + 10, termY + 74, 10, 22, 2);
    ctx.fillStyle = withAlpha(C.coral, 0.8);
    ctx.fill();
  }

  const outP = smooth(span(lt, s1 - 0.2, s1 + 0.6));
  if (outP > 0) {
    text(`created docs/explainer for "Cadence, explained" (kit 1.1.0)`, termX + 26, termY + 142, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      alpha: outP,
    });
    text("next: write the script, scenes and captures", termX + 26, termY + 174, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: outP,
    });
    text("then: narrate, stills, render, mix, master, verify", termX + 26, termY + 206, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: outP,
    });
  }

  // file tree
  const tx = 950;
  const ty = 190;
  const tw = 860;
  panel(tx, ty, tw, 486, {
    r: 16,
    fill: "rgba(10,14,28,0.62)",
    stroke: "rgba(244,241,234,0.1)",
  });
  label("docs/explainer", tx + 24, ty + 36, { size: T.chrome, color: C.coral });

  const rows = [
    ["config.json", "kit pin, title, voice, mix, capture"],
    ["script.json", "one segment per chapter"],
    ["scenes.js", "the argument, drawn"],
    ["assets.js", "names to captures"],
    ["assets/", "the captures"],
    ["golden/", "one reference frame"],
  ];
  rows.forEach((row, i) => {
    const y = ty + 76 + i * 62;
    const active =
      (i === 0 && lt >= s2) ||
      (i >= 1 && i <= 3 && lt >= s3) ||
      (i >= 4 && lt >= s3 + 1.1);
    const p = active ? smooth(span(lt, (i === 0 ? s2 : s3) + 0.1, (i === 0 ? s2 : s3) + 0.5)) : 0.35;
    if (active) {
      rrect(tx + 14, y - 26, tw - 28, 50, 8);
      ctx.fillStyle = withAlpha(C.coral, 0.08);
      ctx.fill();
      rrect(tx + 14, y - 26, 4, 50, 2);
      ctx.fillStyle = withAlpha(C.coral, 0.8);
      ctx.fill();
    }
    text(row[0], tx + 30, y, { size: T.label, family: F.mono, color: active ? C.ink : C.dim });
    text(row[1], tx + tw - 24, y, {
      size: T.chrome,
      family: F.mono,
      color: active ? C.mint : C.faint,
      align: "right",
      alpha: active ? p : 1,
    });
  });

  const lockP = smooth(span(lt, s2 + 0.3, s2 + 1.1));
  if (lockP > 0) {
    panel(110, 528, 760, 190, {
      r: 14,
      alpha: lockP,
      fill: "rgba(22,14,20,0.7)",
      stroke: withAlpha(C.coral, 0.35),
    });
    label("LOCKED BY THE KIT", 134, 566, { size: T.chrome, color: C.coral, alpha: lockP });
    text("video · voice chain · colors · fonts · loudness", 134, 612, {
      size: T.label,
      family: F.mono,
      color: C.ink,
      alpha: lockP,
    });
    text("The loader refuses a project config that tries to change them.", 134, 650, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: lockP,
    });
    text("That refusal is the point.", 134, 680, {
      size: T.chrome,
      family: F.mono,
      color: C.coral,
      alpha: lockP,
    });
  }

  const pinP = smooth(span(lt, s1 + 0.2, s1 + 0.9));
  if (pinP > 0) {
    pill("KIT PIN 1.1.0", 950, 720, C.coral, { alpha: pinP });
    text("the version that will make the film", 950 + 210, 720, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: pinP,
    });
  }
}

// ---------------------------------------------------------------- script

function scriptScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const chapters = [
    ["01", "Cold open"],
    ["02", "The signal"],
    ["03", "One voice"],
    ["04", "The shared chain"],
    ["05", "The quiet trick"],
    ["06", "Two views"],
    ["07", "The clock"],
    ["08", "First Light is data"],
    ["09", "Five moods"],
    ["10", "A small instrument"],
  ];
  const listP = easeOut(span(lt, s1 - 0.1, s1 + 0.7));
  chapters.forEach((ch, i) => {
    const p = easeOut(span(lt, s1 + i * 0.12, s1 + 0.5 + i * 0.12)) * listP;
    if (p <= 0) return;
    const y = 180 + i * 52;
    const hl = i === 2;
    panel(110, y, 500, 44, {
      r: 8,
      alpha: p,
      fill: hl ? "rgba(255,106,77,0.1)" : "rgba(10,14,28,0.55)",
      stroke: hl ? withAlpha(C.coral, 0.5) : "rgba(244,241,234,0.08)",
    });
    text(ch[0], 126, y + 29, { size: T.chrome, family: F.mono, color: hl ? C.coral : C.faint, alpha: p });
    text(ch[1], 168, y + 29, { size: T.label, family: F.mono, color: hl ? C.ink : C.dim, alpha: p });
    if (hl) dot(590, y + 22, 4, C.coral, p, 10);
  });

  const cardP = easeOut(span(lt, s1 + 0.2, s1 + 1.0));
  const cardX = 680;
  const cardY = 180;
  panel(cardX, cardY, 1130, 486, {
    r: 16,
    alpha: cardP,
    fill: "rgba(6,9,18,0.82)",
    stroke: "rgba(244,241,234,0.12)",
  });
  label("script.json / segment 03", cardX + 26, cardY + 38, { size: T.chrome, color: C.mint, alpha: cardP });

  const lines = [
    { t: "{", color: C.dim },
    { t: '  "id": "voice",', color: C.ink },
    { t: '  "title": "One voice",', color: C.ink },
    { t: '  "sentences": [', color: C.dim },
    { t: '    "Follow one key press.",', color: C.dim },
    { t: '    "You hold the A key, and a voice wakes up.",', color: C.coral },
    { t: '    "Three oscillators: a saw, a triangle, a sine.",', color: C.dim },
    { t: '    "An envelope shapes the note.",', color: C.dim },
    { t: '    "Eight voices like this one can run at once."', color: C.dim },
    { t: "  ],", color: C.dim },
    { t: '  "notes": "Wave: hold a key, watch one voice."', color: C.faint },
    { t: "}", color: C.dim },
  ];
  const lineP = easeOut(span(lt, s1 + 0.5, s1 + 1.4));
  lines.forEach((ln, i) => {
    const hl = i === 5;
    if (hl && cardP > 0) {
      rrect(cardX + 18, cardY + 92 + i * 30 - 22, 1094, 30, 5);
      ctx.fillStyle = withAlpha(C.coral, 0.1);
      ctx.fill();
    }
    text(ln.t, cardX + 30, cardY + 92 + i * 30, {
      size: T.label,
      family: F.mono,
      color: ln.color,
      alpha: cardP * lineP * (hl ? 1 : 0.86),
    });
  });

  const styleP = smooth(span(lt, s2, s2 + 0.8));
  if (styleP > 0) {
    const tags = ["SECOND PERSON", "PRESENT TENSE", "SHORT CLAUSES"];
    tags.forEach((tag, i) => {
      const p = smooth(span(lt, s2 + i * 0.25, s2 + 0.55 + i * 0.25));
      pill(tag, 680 + i * 194, 720, i === 2 ? C.coral : C.mint, { alpha: p * styleP });
    });
  }

  const timerP = smooth(span(lt, s3 - 0.1, s3 + 0.7));
  if (timerP > 0) {
    const cx = 1540;
    const cy = 790;
    ring(cx, cy, 76, withAlpha(C.faint, 0.25), 1.2, timerP);
    const fill = clamp(span(lt, s3, s3 + 3.4), 0, 1);
    ctx.save();
    ctx.globalAlpha *= timerP;
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, 76, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    text("3:15", cx, cy + 12, { size: T.body, family: F.mono, color: C.ink, align: "center", alpha: timerP });
    label("TARGET", cx, cy + 44, { size: T.chrome, color: C.coral, align: "center", alpha: timerP });
    text("read it aloud", cx, cy + 112, { size: T.chrome, family: F.mono, color: C.dim, align: "center", alpha: timerP });
  }
}

// ---------------------------------------------------------------- narrate

function narrate(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const sentP = easeOut(span(lt, s0 - 0.1, s0 + 0.8));
  if (sentP > 0) {
    sentenceCard(110, 166, 760, 230, sentP, { size: T.title, labelText: "THE SENTENCE / WAVE" });
    text("43.920s → 47.120s", 138, 414, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      alpha: sentP,
    });
  }

  const arrowP = smooth(span(lt, s1 - 0.3, s1 + 0.5));
  const hashX = 930;
  const hashY = 196;
  if (arrowP > 0) {
    arrow(hashX - 96, 292, hashX - 14, 292, withAlpha(C.mint, 0.5), 1.4, 8, arrowP);
    panel(hashX, hashY, 330, 140, {
      r: 14,
      alpha: arrowP,
      fill: "rgba(10,14,28,0.72)",
      stroke: withAlpha(C.mint, 0.24),
    });
    label("HASH", hashX + 22, hashY + 32, { size: T.chrome, color: C.mint, alpha: arrowP });
    text(SENTENCE_HASH.slice(0, 12), hashX + 22, hashY + 78, {
      size: T.label,
      family: F.mono,
      color: C.ink,
      alpha: arrowP,
    });
    text("text + voice settings", hashX + 22, hashY + 112, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: arrowP,
    });
  }

  const cacheP = smooth(span(lt, s1 + 0.5, s1 + 1.3));
  if (cacheP > 0) {
    arrow(1280, 266, 1348, 266, withAlpha(C.mint, 0.5), 1.4, 8, cacheP);
    panel(1360, hashY, 450, 140, {
      r: 14,
      alpha: cacheP,
      fill: "rgba(10,14,28,0.72)",
      stroke: withAlpha(C.peach, 0.24),
    });
    label("CACHED AUDIO", 1382, hashY + 32, { size: T.chrome, color: C.peach, alpha: cacheP });
    text(`${SENTENCE_HASH.slice(0, 12)}.wav`, 1382, hashY + 78, {
      size: T.label,
      family: F.mono,
      color: C.ink,
      alpha: cacheP,
    });
    text("24 kHz mono · 3.200s", 1382, hashY + 112, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: cacheP,
    });
  }

  const clipP = smooth(span(lt, s2 - 0.2, s2 + 0.8));
  if (clipP > 0) {
    panel(110, 470, 760, 130, {
      r: 14,
      alpha: clipP,
      fill: "rgba(10,14,28,0.72)",
      stroke: withAlpha(C.coral, 0.28),
    });
    label("MEASURED", 134, 504, { size: T.chrome, color: C.coral, alpha: clipP });
    text("3.200s", 846, 504, { size: T.label, family: F.mono, color: C.ink, align: "right", alpha: clipP });
    ctx.save();
    ctx.globalAlpha *= clipP;
    ctx.beginPath();
    ctx.rect(110, 518, 760, 70);
    ctx.clip();
    drawWaveforms(118, 520, 744, 66, lt, C.coral, 0.85);
    ctx.restore();
    text("s-009.wav", 134, 622, { size: T.chrome, family: F.mono, color: C.dim, alpha: clipP });
  }

  const tlP = smooth(span(lt, s2 + 0.2, s2 + 1.0));
  if (tlP > 0) {
    panel(930, 470, 880, 410, {
      r: 16,
      alpha: tlP,
      fill: "rgba(8,12,24,0.74)",
      stroke: "rgba(244,241,234,0.12)",
    });
    label("timeline.json / WAVE", 956, 504, { size: T.chrome, color: C.mint, alpha: tlP });
    text("200.815s", 1784, 504, { size: T.label, family: F.mono, color: C.ink, align: "right", alpha: tlP });

    const gx = 970;
    const gw = 800;
    const gy = 700;
    const toX = (t) => gx + (t / WAVE_DURATION) * gw;
    line(gx, gy, gx + gw, gy, "rgba(244,241,234,0.2)", 1.4, null, tlP);
    WAVE_CHAPTERS.forEach(([t]) => {
      const x = toX(t);
      line(x, gy - 20, x, gy + 20, "rgba(244,241,234,0.18)", 1, null, tlP);
    });

    const segStart = 41.51;
    const segEnd = 67.65;
    rrect(toX(segStart), gy - 42, toX(segEnd) - toX(segStart), 84, 7);
    ctx.fillStyle = withAlpha(C.mint, 0.1 * tlP);
    ctx.fill();
    ctx.strokeStyle = withAlpha(C.mint, 0.4 * tlP);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    text("03 / ONE VOICE", toX(segStart) - 8, gy - 56, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      align: "right",
      alpha: tlP,
    });

    const sx = toX(43.92);
    const ex = toX(47.12);
    rrect(sx, gy - 18, Math.max(10, ex - sx), 36, 5);
    ctx.fillStyle = withAlpha(C.coral, 0.86 * tlP);
    ctx.fill();
    text("the sentence", sx + 10, gy + 58, { size: T.chrome, family: F.mono, color: C.coral, alpha: tlP });

    const playP = smooth(span(lt, s2 + 0.8, s2 + 2.2));
    if (playP > 0) {
      const px = lerp(gx, sx, playP);
      line(px, gy - 60, px, gy + 48, C.coral, 1.6, null, tlP);
      dot(px, gy - 60, 5, C.coral, tlP, 12);
    }

    // ghost repeat
    const againP = smooth(span(lt, s3 + 0.2, s3 + 1.0));
    if (againP > 0) {
      const gy2 = gy + 120;
      line(gx, gy2, gx + gw, gy2, withAlpha(C.faint, 0.2), 1.2, [4, 7], againP * tlP);
      rrect(sx, gy2 - 14, Math.max(10, ex - sx), 28, 4);
      ctx.fillStyle = withAlpha(C.coral, 0.4 * againP * tlP);
      ctx.fill();
      line(gx, gy + 62, gx, gy2 - 14, withAlpha(C.mint, 0.4), 1.1, [4, 6], againP * tlP);
      text("same hash · same clip · same start", gx + gw, gy2 + 34, {
        size: T.chrome,
        family: F.mono,
        color: C.mint,
        align: "right",
        alpha: againP * tlP,
      });
    }
  }
}

// ---------------------------------------------------------------- scenes

function scenesScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const codeP = easeOut(span(lt, s0 - 0.1, s0 + 0.8));
  if (codeP > 0) {
    codeCard(
      [
        { t: "export const SCENES = {", color: C.dim },
        { t: "  voice(t, sc) {", color: C.coral },
        { t: "    // t: seconds inside the scene", color: C.faint },
        { t: "    // sc.start, sc.end, sc.seg", color: C.faint },
        { t: "    const s = sc.seg.sentences;", color: C.ink },
        { t: "    const local = s[1].start - sc.start;", color: C.ink },
        { t: "    draw(t, local, s);", color: C.dim },
        { t: "  },", color: C.dim },
        { t: "  __default(t, sc) { ... }", color: C.dim },
        { t: "};", color: C.dim },
      ],
      110,
      180,
      780,
      { size: T.label, alpha: codeP, title: "scenes.js" },
    );
  }

  const beatP = smooth(span(lt, s1, s1 + 0.8));
  if (beatP > 0) {
    const rx = 110;
    const ry = 616;
    const rw = 780;
    panel(rx, ry, rw, 150, {
      r: 14,
      alpha: beatP,
      fill: "rgba(8,12,24,0.7)",
      stroke: withAlpha(C.coral, 0.22),
    });
    label("SEGMENT voice", rx + 22, ry + 32, { size: T.chrome, color: C.coral, alpha: beatP });
    const ticks = [0, 2.252, 5.464, 13.212, 20.792, 23.744];
    const gx = rx + 24;
    const gw = rw - 48;
    const gy = ry + 92;
    const local = clamp(lt - s1 - 0.5, 0, 23.744);
    const px = gx + (local / 23.744) * gw;
    line(gx, gy, gx + gw, gy, "rgba(244,241,234,0.16)", 1.2, null, beatP);
    ticks.forEach((tk) => {
      const x = gx + (tk / 23.744) * gw;
      line(x, gy - 10, x, gy + 10, "rgba(244,241,234,0.28)", 1.1, null, beatP);
    });
    line(px, gy - 18, px, gy + 18, C.coral, 1.6, null, beatP);
    dot(px, gy - 18, 4, C.coral, beatP, 10);
    const idx = ticks.findIndex((tk, i) => local >= tk && local < (ticks[i + 1] ?? 23.744));
    text(`${String(Math.max(1, idx + 1)).padStart(2, "0")} / 05`, rx + rw - 22, ry + 32, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      align: "right",
      alpha: beatP,
    });
    text("time drives the sentence, not the slide", gx, ry + 128, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      alpha: beatP,
    });
  }

  const frameP = easeOut(span(lt, s1 + 0.1, s1 + 1.0));
  if (frameP > 0) {
    const fx = 950;
    const fy = 180;
    const fw = 860;
    const fh = 484;
    glow(fx + fw / 2, fy + fh / 2, fw * 0.58, C.coral, 0.12);
    panel(fx - 7, fy - 7, fw + 14, fh + 14, {
      r: 20,
      alpha: frameP,
      fill: "rgba(8,10,22,0.4)",
      stroke: "rgba(244,241,234,0.14)",
    });
    image("voice", fx, fy, fw, fh, frameP, 12);
    label("WAVE / ONE VOICE", fx, fy - 22, { size: T.chrome, color: C.dim, alpha: frameP });
    text("frame at 42.40s", fx + fw, fy - 22, {
      size: T.chrome,
      family: F.mono,
      color: C.faint,
      align: "right",
      alpha: frameP,
    });
  }

  const legendP = smooth(span(lt, s3 - 0.1, s3 + 0.8));
  if (legendP > 0) {
    dot(120, 800, 5, C.mint, legendP);
    text("KIT SUPPLIES", 140, 806, { size: T.chrome, family: F.mono, color: C.mint, ls: 2, alpha: legendP });
    text("frame · type · colors · chrome", 140, 840, { size: T.label, family: F.mono, color: C.ink, alpha: legendP });
    dot(120, 890, 5, C.coral, legendP);
    text("PROJECT SUPPLIES", 140, 896, { size: T.chrome, family: F.mono, color: C.coral, ls: 2, alpha: legendP });
    text("the argument, with those primitives", 140, 930, {
      size: T.label,
      family: F.mono,
      color: C.ink,
      alpha: legendP,
    });
  }
}

// ---------------------------------------------------------------- stills

function stillsScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const labels = [
    ["01", "0:04.20"],
    ["02", "0:24.98"],
    ["03", "0:42.40"],
    ["04", "1:07.00"],
    ["05", "1:30.97"],
    ["06", "1:46.40"],
    ["07", "2:07.68"],
    ["08", "2:23.67"],
    ["09", "2:39.85"],
    ["10", "2:57.90"],
  ];
  const keys = ["still01", "still02", "still03", "still04", "still05", "still06", "still07", "still08", "still09", "still10"];
  const tw = 296;
  const th = 166;
  const gap = 20;
  const x0 = 180;
  const y0 = 196;

  const sheetOut = 1 - smooth(span(lt, s3 - 0.2, s3 + 0.4));
  const sheetP = easeOut(span(lt, s0, s0 + 0.8));
  const hlP = smooth(span(lt, s2 - 0.1, s2 + 0.7));

  if (sheetP > 0) {
    keys.forEach((key, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = x0 + col * (tw + gap);
      const y = y0 + row * (th + gap + 34);
      const p = easeOut(span(lt, s0 + 0.2 + i * 0.26, s0 + 0.6 + i * 0.26)) * sheetP;
      if (p <= 0) return;
      const hi = i === 2 ? hlP : 0;
      ctx.save();
      ctx.globalAlpha *= p * sheetOut;
      if (hi > 0) {
        glow(x + tw / 2, y + th / 2, tw * 0.7, C.coral, 0.22 * hi);
        panel(x - 3, y - 3, tw + 6, th + 6, {
          r: 10,
          fill: "transparent",
          stroke: withAlpha(C.coral, 0.8 * hi),
          lw: 1.6,
          glow: withAlpha(C.coral, 0.4),
        });
      }
      image(key, x, y, tw, th, 1, 8);
      ctx.restore();
      text(`${labels[i][0]}  ${labels[i][1]}`, x, y + th + 22, {
        size: T.chrome,
        family: F.mono,
        color: hi > 0 ? C.coral : C.faint,
        alpha: p * sheetOut,
      });
    });

    const capP = smooth(span(lt, s2, s2 + 0.7)) * sheetOut;
    if (capP > 0) {
      text("10 chapters · 10 stills · start plus three seconds", 180, 748, {
        size: T.body,
        color: C.ink,
        alpha: capP,
      });
      text("Look before you encode.", 180, 790, {
        size: T.caption,
        family: F.mono,
        color: C.mint,
        alpha: capP,
      });
    }
  }

  const liveP = smooth(span(lt, s3, s3 + 0.9));
  if (liveP > 0) {
    const bx = 340;
    const by = 180;
    const bw = 1240;
    const bh = 740;
    panel(bx, by, bw, bh, {
      r: 18,
      alpha: liveP,
      fill: "rgba(6,9,18,0.96)",
      stroke: "rgba(244,241,234,0.16)",
      glow: withAlpha(C.mint, 0.12),
    });
    text("● ● ●", bx + 24, by + 34, { size: T.chrome, family: F.mono, color: C.faint, alpha: liveP });
    rrect(bx + 100, by + 16, bw - 124, 34, 8);
    ctx.fillStyle = "rgba(244,241,234,0.05)";
    ctx.fill();
    text("127.0.0.1  /  live preview", bx + 120, by + 39, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: liveP,
    });
    text("30 fps", bx + bw - 24, by + 39, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      align: "right",
      alpha: liveP,
    });
    image("voice", bx + 60, by + 64, bw - 120, (bw - 120) * 0.5625, liveP, 10);
    text("serve / the same renderer that encodes", bx + 24, by + bh - 20, {
      size: T.chrome,
      family: F.mono,
      color: C.coral,
      alpha: liveP,
    });
  }
}

// ---------------------------------------------------------------- render

function renderScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const colW = 520;
  const y = 190;
  const h = 516;
  const xs = [110, 700, 1290];

  const panels = [
    { n: "01", name: "RENDER", on: s0, color: C.coral },
    { n: "02", name: "MIX", on: s1, color: C.mint },
    { n: "03", name: "MASTER", on: s2, color: C.peach },
  ];

  // ghost frame for the two stages that have not spoken yet
  panels.forEach((p, i) => {
    panel(xs[i], y, colW, h, {
      r: 16,
      alpha: 0.16,
      fill: "rgba(10,14,28,0.3)",
      stroke: "rgba(244,241,234,0.08)",
    });
    text(p.n, xs[i] + 24, y + 42, { size: T.chrome, family: F.mono, color: C.faint, alpha: 0.3 });
    text(p.name, xs[i] + 24, y + 74, { size: T.label, family: F.mono, color: C.faint, ls: 2.4, alpha: 0.3 });
  });

  panels.forEach((p, i) => {
    const a = easeOut(span(lt, p.on - 0.1, p.on + 0.7));
    panel(xs[i], y, colW, h, {
      r: 16,
      alpha: a,
      fill: "rgba(10,14,28,0.64)",
      stroke: withAlpha(p.color, 0.22),
    });
    text(p.n, xs[i] + 24, y + 42, { size: T.chrome, family: F.mono, color: p.color, alpha: a });
    text(p.name, xs[i] + 24, y + 74, { size: T.label, family: F.mono, color: C.ink, ls: 2.4, alpha: a });
    if (i < 2) {
      arrow(xs[i] + colW + 8, y + 70, xs[i + 1] - 8, y + 70, withAlpha(C.faint, 0.7), 1.4, 8, a);
    }
  });

  // render
  const renderA = easeOut(span(lt, s0, s0 + 0.7));
  if (renderA > 0) {
    const x = xs[0];
    text("30", x + 24, y + 196, { size: T.display, weight: 500, color: C.ink, alpha: renderA });
    text("frames / second", x + 138, y + 196, { size: T.chrome, family: F.mono, color: C.dim, alpha: renderA });
    text("6,054 frames", x + 24, y + 246, { size: T.label, family: F.mono, color: C.coral, alpha: renderA });
    text("VP9 · WebM · 14 Mbps", x + 24, y + 280, { size: T.chrome, family: F.mono, color: C.dim, alpha: renderA });

    const gx = x + 24;
    const gy = y + 318;
    const gp = clamp(span(lt, s0 + 0.4, s0 + 3.8), 0, 1);
    const cols = 6;
    const rows = 3;
    const cw = 72;
    const ch = 42;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const on = i / (cols * rows) <= gp;
        rrect(gx + c * (cw + 6), gy + r * (ch + 6), cw, ch, 4);
        ctx.fillStyle = on ? withAlpha(C.coral, 0.34) : "rgba(244,241,234,0.04)";
        ctx.fill();
        ctx.strokeStyle = on ? withAlpha(C.coral, 0.5) : "rgba(244,241,234,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    text("intermediate: video.webm", x + 24, y + h - 24, {
      size: T.chrome,
      family: F.mono,
      color: C.faint,
      alpha: renderA,
    });
  }

  // mix
  const mixA = easeOut(span(lt, s1 - 0.1, s1 + 0.7));
  if (mixA > 0) {
    const x = xs[1];
    label("NARRATION", x + 24, y + 126, { size: T.chrome, color: C.coral, alpha: mixA });
    ctx.save();
    ctx.globalAlpha *= mixA;
    ctx.beginPath();
    ctx.rect(x + 22, y + 136, colW - 44, 42);
    ctx.clip();
    drawWaveforms(x + 24, y + 136, colW - 48, 42, lt, C.coral, 0.8);
    ctx.restore();
    label("MUSIC BED · OPTIONAL", x + 24, y + 210, { size: T.chrome, color: C.peach, alpha: mixA });
    ctx.save();
    ctx.globalAlpha *= mixA;
    ctx.beginPath();
    ctx.rect(x + 22, y + 220, colW - 44, 42);
    ctx.clip();
    drawWaveforms(x + 24, y + 220, colW - 48, 42, lt * 0.7, C.peach, 0.45);
    ctx.restore();

    const meter = clamp(span(lt, s1 + 0.3, s1 + 2.4), 0, 1);
    const lufs = lerp(-24, -16, easeOut(meter));
    text(lufs.toFixed(1), x + 24, y + 366, { size: T.title, weight: 500, color: C.mint, alpha: mixA });
    text("LUFS", x + 186, y + 366, { size: T.chrome, family: F.mono, color: C.dim, alpha: mixA });
    text("duck 6:1 · bed at -24", x + 24, y + 400, { size: T.chrome, family: F.mono, color: C.dim, alpha: mixA });
    text("intermediate: mix.wav", x + 24, y + h - 24, {
      size: T.chrome,
      family: F.mono,
      color: C.faint,
      alpha: mixA,
    });
  }

  // master
  const masterA = easeOut(span(lt, s2 - 0.1, s2 + 0.7));
  if (masterA > 0) {
    const x = xs[2];
    panel(x + 24, y + 112, colW - 48, 190, {
      r: 12,
      alpha: masterA,
      fill: "rgba(8,12,24,0.82)",
      stroke: withAlpha(C.peach, 0.3),
    });
    text("film.mp4", x + 44, y + 180, { size: T.caption, family: F.mono, color: C.ink, alpha: masterA });
    text("1920x1080 · 30 fps", x + 44, y + 212, { size: T.chrome, family: F.mono, color: C.dim, alpha: masterA });
    text("H.264 CRF 19 · AAC 192k", x + 44, y + 240, { size: T.chrome, family: F.mono, color: C.dim, alpha: masterA });

    const rows = ["H.264 CRF 19", "AAC 192k", "10 chapters", "faststart"];
    rows.forEach((r, i) => {
      const p = smooth(span(lt, s2 + 0.3 + i * 0.45, s2 + 0.7 + i * 0.45));
      text(r, x + 24, y + 356 + i * 36, { size: T.chrome, family: F.mono, color: p > 0 ? C.ink : C.faint, alpha: masterA });
      check(x + colW - 44, y + 350 + i * 36, p);
    });
  }

  const endP = smooth(span(lt, s3 - 0.1, s3 + 0.8));
  if (endP > 0) {
    const chips = [
      ["video.webm", false],
      ["mix.wav", false],
      ["film.mp4", true],
    ];
    chips.forEach(([name, primary], i) => {
      const x = 110 + i * 300;
      panel(x, 790, 280, 72, {
        r: 10,
        alpha: endP,
        fill: primary ? "rgba(255,106,77,0.12)" : "rgba(10,14,28,0.6)",
        stroke: primary ? withAlpha(C.coral, 0.6) : "rgba(244,241,234,0.1)",
        glow: primary ? withAlpha(C.coral, 0.25) : null,
      });
      text(name, x + 20, 835, {
        size: T.caption,
        family: F.mono,
        color: primary ? C.coral : C.dim,
        alpha: endP,
      });
      if (!primary) {
        line(x + 18, 824, x + 140, 824, withAlpha(C.faint, 0.7), 1.4, null, endP);
      }
    });
    text("the deliverable", 1080, 835, { size: T.caption, family: F.mono, color: C.mint, alpha: endP });
    arrow(1000, 826, 1060, 826, withAlpha(C.mint, 0.5), 1.4, 8, endP);
  }
}

// ---------------------------------------------------------------- verify

function verifyScene(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const gates = [
    ["script hash matches narration", "fc44aeb7..."],
    ["house voice, no fallback", "Kokoro af_heart"],
    ["duration", "200.815s vs 200.815s"],
    ["video format", "h264 1920x1080 30"],
    ["audio format", "aac 48000Hz"],
    ["chapters", "10 / 10"],
    ["loudness", "-16.0 LUFS"],
    ["true peak", "-2.7 dBFS"],
    ["golden frame", "ssim 1.0000"],
  ];

  gates.forEach((g, i) => {
    const y = 178 + i * 58;
    let start = s2;
    if (i < 2) start = s1;
    if (i === 8) start = s2 + 1.6;
    const p = smooth(span(lt, start + i * 0.12, start + 0.55 + i * 0.12));
    panel(110, y, 930, 48, {
      r: 8,
      alpha: 0.55 + 0.45 * p,
      fill: i === 8 ? "rgba(255,106,77,0.06)" : "rgba(10,14,28,0.6)",
      stroke: p > 0.5 ? (i === 8 ? withAlpha(C.coral, 0.4) : "rgba(244,241,234,0.12)") : "rgba(244,241,234,0.06)",
    });
    ctx.save();
    ctx.globalAlpha *= 0.35 + 0.65 * p;
    ctx.strokeStyle = p > 0.5 ? C.mint : C.faint;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(140, y + 24, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    check(140, y + 24, p);
    text(g[0], 168, y + 30, { size: T.label, family: F.mono, color: p > 0.5 ? C.ink : C.dim });
    text(g[1], 1016, y + 30, {
      size: T.chrome,
      family: F.mono,
      color: p > 0.5 ? C.mint : C.faint,
      align: "right",
    });
  });

  const frameP = smooth(span(lt, s0 + 0.3, s0 + 1.1));
  if (frameP > 0) {
    label("GOLDEN", 1130, 178, { size: T.chrome, color: C.faint, alpha: frameP });
    image("golden", 1130, 194, 600, 338, frameP, 8);
    label("RENDERED", 1130, 566, { size: T.chrome, color: C.faint, alpha: frameP });
    image("verify", 1130, 582, 600, 338, frameP, 8);
    const ssimP = smooth(span(lt, s2 + 1.8, s2 + 2.5));
    if (ssimP > 0) {
      pill("SSIM 1.0000 ≥ 0.985", 1430, 962, C.mint, { alpha: ssimP, align: "center" });
    }
  }

  const failP = smooth(span(lt, s3 - 0.1, s3 + 0.8));
  if (failP > 0) {
    panel(110, 760, 930, 120, {
      r: 12,
      alpha: failP,
      fill: "rgba(30,12,16,0.7)",
      stroke: withAlpha(C.coral, 0.4),
    });
    cross(146, 796, failP);
    text("font fallback · drifted chapter", 172, 804, {
      size: T.label,
      family: F.mono,
      color: C.coral,
      alpha: failP,
    });
    text("the build stops here, not on someone's screen", 134, 852, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: failP,
    });
  }
}

// ---------------------------------------------------------------- close

function close(lt, sc) {
  const s = times(sc);
  const s0 = s[0].start;
  const s1 = s[1].start;
  const s2 = s[2].start;
  const s3 = s[3].start;

  head(sc, lt);

  const sentP = easeOut(span(lt, s0, s0 + 0.8));
  if (sentP > 0) {
    sentenceCard(110, 150, 680, 224, sentP, { size: T.title, labelText: "THE SENTENCE" });
  }

  const frameP = easeOut(span(lt, s0 + 0.2, s0 + 1.0));
  if (frameP > 0) {
    const fx = 1040;
    const fy = 130;
    const fw = 760;
    const fh = 428;
    glow(fx + fw / 2, fy + fh / 2, fw * 0.58, C.coral, 0.14);
    panel(fx - 7, fy - 7, fw + 14, fh + 14, {
      r: 20,
      alpha: frameP,
      fill: "rgba(8,10,22,0.4)",
      stroke: withAlpha(C.coral, 0.22),
    });
    image("voice", fx, fy, fw, fh, frameP, 12);
  }

  const chromeOut = 1 - smooth(span(lt, s3 - 0.5, s3 + 0.3));

  const fixtureP = smooth(span(lt, s0 + 0.4, s0 + 1.2)) * chromeOut;
  if (fixtureP > 0) {
    pill("WAVE FIXTURE", 1040, 590, C.mint, { alpha: fixtureP });
    text("same script · same cache · 200.815s", 1040, 630, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: fixtureP,
    });
  }

  const chain = ["SCRIPT", "VOICE", "TIMELINE", "RENDER", "MIX", "VERIFY"];
  const chipW = 250;
  const chipGap = 32;
  const chainY = 660;
  const chainP = easeOut(span(lt, s1 - 0.2, s1 + 0.8));
  if (chainP > 0) {
    chain.forEach((name, i) => {
      const x = 110 + i * (chipW + chipGap);
      panel(x, chainY, chipW, 64, {
        r: 10,
        alpha: chainP,
        fill: "rgba(10,14,28,0.7)",
        stroke: i === 0 || i === 5 ? withAlpha(C.coral, 0.4) : "rgba(244,241,234,0.12)",
      });
      text(name, x + chipW / 2, chainY + 40, {
        size: T.chrome,
        family: F.mono,
        color: i === 0 || i === 5 ? C.coral : C.ink,
        align: "center",
        ls: 2,
        alpha: chainP,
      });
      if (i < chain.length - 1) {
        arrow(x + chipW + 5, chainY + 32, x + chipW + chipGap - 5, chainY + 32, withAlpha(C.faint, 0.6), 1.2, 7, chainP);
      }
    });
    arrow(130, 382, 130, chainY - 6, withAlpha(C.mint, 0.45), 1.2, 8, chainP);
    arrow(1650, chainY - 6, 1650, 566, withAlpha(C.mint, 0.45), 1.2, 8, chainP);
  }

  const calloutP = smooth(span(lt, s1 + 0.8, s1 + 1.6)) * chromeOut;
  if (calloutP > 0) {
    text("change the script → the timeline moves", 110, 760, {
      size: T.chrome,
      family: F.mono,
      color: C.mint,
      alpha: calloutP,
    });
  }

  const pinP = smooth(span(lt, s2 - 0.1, s2 + 0.7)) * chromeOut;
  if (pinP > 0) {
    text("every project pins the version that made it", 110, 798, {
      size: T.chrome,
      family: F.mono,
      color: C.dim,
      alpha: pinP,
    });
    pill("KIT PIN 1.1.0", 1580, 798, C.coral, { alpha: pinP });
  }

  const loopP = smooth(span(lt, s3 - 0.2, s3 + 1.4));
  if (loopP > 0) {
    const lx = 70;
    const rx = 1850;
    const ty = 300;
    const by = 950;
    ctx.save();
    ctx.globalAlpha *= loopP;
    ctx.strokeStyle = withAlpha(C.coral, 0.5);
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.moveTo(1800, ty);
    ctx.lineTo(rx, ty);
    ctx.lineTo(rx, by);
    ctx.lineTo(lx, by);
    ctx.lineTo(lx, ty);
    ctx.lineTo(104, ty);
    ctx.stroke();
    ctx.restore();
    arrow(lx, ty, 102, ty, withAlpha(C.coral, 0.7), 1.6, 9, loopP);
    const travel = (lt * 0.11) % 1;
    const perim = (by - ty) * 2 + (rx - lx);
    let d = travel * perim;
    let px;
    let py;
    if (d < by - ty) {
      px = rx;
      py = ty + d;
    } else if ((d -= by - ty) < rx - lx) {
      px = rx - d;
      py = by;
    } else {
      d -= rx - lx;
      px = lx;
      py = by - d;
    }
    dot(px, py, 4, C.coral, loopP, 12);
    text("again", lx + 14, by - 14, { size: T.chrome, family: F.mono, color: C.coral, alpha: loopP });
  }

  const lastP = smooth(span(lt, s3 + 0.7, s3 + 1.6));
  if (lastP > 0) {
    text("A sentence goes in. A film comes out.", W / 2, 800, {
      size: T.title,
      weight: 500,
      color: C.ink,
      align: "center",
      alpha: lastP,
    });
    text("And it can come out again.", W / 2, 878, {
      size: T.title,
      weight: 500,
      color: C.coral,
      align: "center",
      alpha: lastP,
    });
  }
}

export const SCENES = {
  intro,
  layers,
  init: initScene,
  script: scriptScene,
  narrate,
  scenes: scenesScene,
  stills: stillsScene,
  render: renderScene,
  verify: verifyScene,
  close,
  __default: intro,
};
