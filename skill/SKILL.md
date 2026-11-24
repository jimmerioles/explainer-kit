---
name: explainer-video
description: >
  Produce a house-style explainer video for a project: a 3:15 narrated film at
  1920x1080, 30 fps, with canvas diagrams, chapter markers and a -16 LUFS mix,
  built with the explainer-kit pipeline. Use when the user asks for an explainer
  video, launch video, demo video, walkthrough video, product video, or says
  "explain this project on video", "make a video about this", or wants to revise
  an existing explainer film.
---

# Explainer video

The pipeline lives in `~/Work/jimmerioles/explainer-kit`, version `1.1.0`.
Read `<kit>/STYLE.md` before writing the script, and `<kit>/PRODUCTION.md` for
the full sequence. `examples/wave/` in the kit is the reference film: when in
doubt, it shows what good looks like.

**Do not build a new renderer, TTS script or FFmpeg chain in the project.**
That is how the series drifts. The kit is the machine.

## Preflight

```bash
KIT=~/Work/jimmerioles/explainer-kit
node $KIT/bin/explainer.mjs doctor
```

If the kit is missing, stop and tell the user. Do not recreate it.
If any check fails, fix the environment first.

## Workflow

1. **Scaffold** in the project root:

   ```bash
   node $KIT/bin/explainer.mjs init --title "Project name, explained"
   ```

   If `docs/explainer/` already exists, read its config and script and continue
   from where the film is, do not re-init.

2. **Write the script.** Edit `docs/explainer/script.json`. Ten segments, one
   idea each, 3 to 5 sentences each, second person, present tense, no em dashes.
   Put shot notes in `notes`, never in `sentences`. Read it aloud with a timer:
   the target is 195 seconds.

3. **Narrate.**

   ```bash
   node $KIT/bin/explainer.mjs narrate
   ```

   The timeline is now fixed. If the runtime is wrong, edit the script and run
   `narrate` again before touching any scene. The first Kokoro run downloads the
   model (about 300 MB); later runs are local. If the narration sounds off, run
   `node $KIT/bin/explainer.mjs voicecheck` and compare against
   `golden/voices/<engine>-<voice>.json`.

4. **Write the scenes.** Edit `docs/explainer/scenes.js`. Every segment id needs
   a scene function. Use `__default` for segments that share a layout. Read the
   timeline through `sc`, never hardcode chapter times.

5. **Capture the product.** Set `capture.url` and `capture.selector` in
   `config.json`, or edit `docs/explainer/capture.mjs` with a hook that drives
   the UI. Save stills into `docs/explainer/assets/`, then name them in
   `assets.js`.

6. **Look before rendering.**

   ```bash
   node $KIT/bin/explainer.mjs stills
   ```

   View all ten PNGs in `docs/explainer/build/stills/`. Fix layout here. A full
   render is the expensive way to find a title that overflows. When the look is
   right, lock the frame `verify` will compare:

   ```bash
   node $KIT/bin/explainer.mjs golden
   ```

   Inspect `golden/frame.png` before committing it. Re-run `golden` only after an
   intentional visual change.

7. **Music.** Put the bed at `docs/explainer/music.m4a` and set `mix.bed`. The
   house bed is the `tech` score: 100 BPM, A major, seed 1, rendered
   locally and extended to the film. The Wave fixture uses the same bed, trimmed
   to its length. A bed must be 48 kHz stereo, -24.5 LUFS within 3 LU, at or
   below -2 dBFS true peak, and at least as long as the narration. Record the
   engine, style, BPM, key, seed and license in `music.json`. If the project has
   no music, set `"bed": null` and say so in the handoff. Do not invent a
   synthetic bed without asking.

8. **Build and gate.**

   ```bash
   node $KIT/bin/explainer.mjs render    # several minutes
   node $KIT/bin/explainer.mjs mix
   node $KIT/bin/explainer.mjs master
   node $KIT/bin/explainer.mjs verify
   ```

   `verify` must pass with the frame comparison on. `--fast` is for audio-only
   iterations, not for shipping.

9. **Hand off.** `docs/explainer/build/film.mp4` is the deliverable,
   `build/poster.jpg` is the thumbnail, `build/script.md` is the companion
   script. Publish the MP4 as a release asset, not a commit. Record the kit
   version in the release notes.

## Writing scenes

`scenes.js` exports a map from segment id to a function `(t, sc)`. `t` is
seconds since the scene started. `sc` is `{ id, index, total, start, end, seg }`,
and `sc.seg.sentences` is the narration for that chapter. Each sentence is
`{ text, start, end, duration, index }`, with absolute times, so `s.start - sc.start`
gives the moment it begins inside the scene.

```js
import { W, H, C, F, text, label, line, panel, glow, smooth, span, revealText } from "/kit/render/helpers.js";

export const SCENES = {
  intro(t, sc) {
    const p = smooth(span(t, 0.2, 1.4));
    revealText(sc.seg.title, 110, H * 0.5, p, { size: 96, weight: 500 });
  },
  __default(t, sc) {
    label(sc.id, 110, 80, { color: C.faint });
  },
};
```

Rules for the drawing:

- Stage is 1920 × 1080. Margins: 110 left and right, 80 top, 42 bottom.
- Use the theme tokens `C`, `F` and the type scale. Do not invent colors or
  font sizes.
- Primitives: `text`, `label`, `paragraph`, `revealText`, `panel`, `rrect`,
  `line`, `curve`, `arrow`, `dot`, `ring`, `glow`, `image`, `imageCrop`,
  `drawSaw`, `drawTriangle`, `drawSine`, `drawWaveforms`, `drawWordmark`,
  `drawOrb`, `PALETTES`, `springPath`.
- Easing: `smooth`, `easeOut`, `easeIn`, `easeInOut`, `span`, `pulse`, `clamp`,
  `lerp`, `withAlpha`.
- `image("key", x, y, w, h, alpha, radius, zoom)` draws an entry from
  `assets.js`. Screenshots are objects on the stage, never full bleed.
- Build a diagram as the sentence explains it. Hold the finished frame for at
  least a second.
- No stock footage, no looping waveform video, no CSS. Canvas only.

If the project needs a primitive the kit does not have, add it to the kit's
`render/helpers.js`, run the Wave fixture, then bump the kit version. Do not
fork the helper into the project.

## Non-negotiables

- 1920 × 1080, 30 fps, H.264 CRF 19, AAC 192k, faststart.
- One house voice, Kokoro `af_heart` at speed 0.88, one voice chain, one mix
  chain. A project may pick a different voice only deliberately; Edge is a
  fallback.
- One house bed, `tech` at 100 BPM, A major, seed 1. It is 48 kHz
  stereo, -24.5 LUFS within 3 LU, at or below -2 dBFS true peak, and at least as
  long as the narration.
- -16.0 LUFS integrated, true peak at or below -1.5 dBFS.
- Ten chapters, 3:00 to 3:30, one idea per chapter.
- No em dashes in the narration.
- The MP4 is never committed. The script, config, assets, music metadata and
  poster are.

## Failure modes

- **`verify` says script drift:** re-run `narrate`, then `render`.
- **`verify` says voice fallback:** the narration fell back. For Kokoro, check
  the model download and `npm install`; for Edge, re-run later. Do not ship the
  fallback by accident.
- **`verify` says the music bed is short or loud:** extend or normalize the bed.
  Do not lower the gate, and do not let `mix` pad silence.
- **A frame looks wrong only in the encoded file:** check the still at the same
  timestamp first. If the still is right, the bug is in encode settings, not
  layout.
- **SSIM fails after a font change:** fix font loading. Do not lower the floor.
- **The kit is wrong:** fix it in the kit repo, run `examples/wave`, bump the
  version, then move the project. Never patch the kit from inside a project.
