// Project scenes. Each key matches a segment id in script.json.
// The kit supplies the frame, the fade, the chapter counter and the type system.
// This file supplies the argument.

import {
  W,
  H,
  C,
  text,
  label,
  line,
  glow,
  smooth,
  span,
} from "/kit/render/helpers.js";

function ground(sc, t) {
  line(110, 108, W - 110, 108, C.line, 1);
  label(sc.id.replace(/-/g, " "), 110, 80, { color: C.faint });
  glow(W * 0.72, H * 0.42, 520, C.coral, 0.1);
  return t;
}

function title(t, sc) {
  ground(sc, t);
  const p = smooth(span(t, 0.2, 1.4));
  text(sc.seg.title, 110, H * 0.5, { size: 96, weight: 500, alpha: p });
  text(sc.seg.sentences[0]?.text ?? "", 110, H * 0.5 + 84, {
    size: 30,
    weight: 400,
    color: C.dim,
    alpha: p,
  });
}

export const SCENES = {
  intro: title,
  thesis: title,
  close: title,

  // Used for any segment without a bespoke scene.
  __default: title,
};
