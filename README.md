# explainer-kit

One deterministic pipeline for every explainer film. The renderer, the voice
chain, the mix, the encode settings and the type system live here. A project
supplies only its argument: a script, scenes, captures and a music bed.

This exists because a one-off film is a memory, and a series is a system.

## The model

Three layers, with a hard boundary:

```text
explainer-kit/                     the machine: render, voice, mix, master, gates
~/.agents/skills/explainer-video/  the brain: when to run it, in what order, what to check
<project>/docs/explainer/          the content: script.json, scenes.js, assets, bed
```

Numbers live in the kit. Procedure lives in the skill. Content lives in the
project. If a number appears in two places, it will disagree within three films.

## Quick start

```bash
npm install
npm link                  # puts `explainer` on PATH, pointing at this checkout

cd ~/Work/you/next-project
explainer init --title "Cadence, explained"
```

That writes:

```text
docs/explainer/
  config.json     kit pin, title, voice, music bed, capture target, verify rules
  script.json     one segment per chapter, one sentence per beat
  scenes.js       the argument, drawn with the house primitives
  assets.js       names to screenshots
  capture.mjs     a working capture hook, or leave the built-in capture
  assets/         captures
  golden/         one reference frame for this film
```

Then:

```bash
explainer narrate    # TTS + cache -> narration.wav, timeline.json
explainer capture    # app stills for scenes.js
explainer stills     # one PNG per chapter, for looking at
explainer golden     # render the fixed frame into golden/frame.png
explainer render     # WebCodecs -> video.webm
explainer mix        # narration + bed -> mix.wav at -16 LUFS
explainer master     # H.264, AAC, chapters, faststart -> film.mp4
explainer verify     # the gates
explainer voicecheck # does the pinned house voice still sound the same?
explainer script     # build/script.md, the companion doc
```

`explainer build` runs narrate, render, mix and master in one go. `verify` stays
a separate, deliberate step. `npm run check` runs the fast repository checks:
syntax, JSON, config pins, stale paths and prose rules, with no browser or
ffmpeg required.

## What is locked

A project may set:

- `title`, `slug`, `targetSeconds`
- `voice.engine`, `voice.name` and `voice.fallback`
- `theme.chrome` (the three lines of frame furniture)
- `theme.accent` (one accent color, replaces coral)
- `mix.bed` (path to the music bed, inside `docs/explainer`)
- `capture` (URL, selector, viewport, or a `capture.mjs` hook)
- `verify.golden` and `verify.frameAt` (which frame this film compares)

Everything else is the house style and lives in `config/defaults.json`: frame
size, fps, CRF, codec, voice speed, voice chain, gaps, loudness targets,
sidechain settings, gate thresholds, type families, margins, colors. The loader
refuses locked keys and unknown keys, so a typo cannot silently do nothing.

## The house voice and the house bed

One voice, Kokoro `af_heart` at speed `0.88`, 24 kHz source, resampled to 48 kHz
by the kit. Edge remains available as a deliberate fallback, never as a second
house voice. `voicecheck` compares each engine and voice against
`golden/voices/<engine>-<voice>.json`.

The root film uses the house `tech` score: 100 BPM, A major, seed 1, composed as
an editable score and rendered locally, then extended to the film's length and
installed as `docs/explainer/music.m4a`. It is original, deterministic, MIT
licensed and safe for commercial video. The Wave fixture uses the same house bed,
trimmed to its length.

A bed must be:

- 48 kHz stereo, at least as long as the narration.
- -24.5 LUFS integrated, within 3 LU. `verify` fails a bed at -14.
- True peak at or below -2 dBFS.
- Cleared for the intended use. Record the engine, track, license and render
  command in `docs/explainer/music.json`.

The kit applies the gain, the ducking sidechain, the 2.5 second fade and the
master loudness. It does not write music.

## Consistency gates

`verify` checks, and fails the build on:

1. **Script drift.** `script.json` changed after the last `narrate`.
2. **Voice.** The timeline uses the configured voice, with no fallback.
3. **Timing.** Film duration matches the timeline within 150 ms.
4. **Runtime target.** The film is within the project's target window.
5. **Kit pin.** The project pins the kit version that made it.
6. **Video format.** H.264, 1920x1080, 30 fps, `yuv420p`, High@4.1.
7. **Audio format.** AAC, 48 kHz, stereo.
8. **Chapters.** One per segment, with matching starts and titles.
9. **Music bed.** Present when configured, long enough, at the house level and
   peak ceiling.
10. **Loudness.** -16.0 LUFS integrated, within 0.3 LU.
11. **Peak.** True peak at or below -1.5 dBFS.
12. **Look.** A rendered frame at a fixed timestamp reaches SSIM 0.985 against
    the project's golden frame. Font fallback and spacing regressions fail here.

The narration cache is the quiet gate. Audio is keyed by a hash of the text
plus the voice settings, so re-renders reuse the exact same files and the
timeline cannot drift. Kokoro caches WAV, Edge caches MP3. Delete
`.cache/explainer/` to force a fresh read of the voice.

## The Wave fixture

`examples/wave/` is the film this kit was extracted from. It is not a demo. It
is the end-to-end regression test: the kit must still reproduce the reference
film from its own script and assets. A local voice cache makes repeat runs fast
and stable; delete it to force a fresh read. The picture and script are the
shipped film. The narration is the Kokoro house voice at speed 0.88, and the
music is the house bed trimmed to the fixture.

```bash
explainer doctor --project examples/wave
explainer narrate --project examples/wave
explainer render --project examples/wave
explainer mix --project examples/wave
explainer master --project examples/wave
explainer verify --project examples/wave
```

Expected master: 200.81s, 1920x1080, 30 fps, -16.0 LUFS, ten chapters.

## Layout

```text
bin/explainer.mjs        the CLI
src/                     config, TTS, timeline, mix, master, render, verify
render/                  canvas frame, type system, primitives, chrome
fonts/                   local woff2, no network at render time
config/defaults.json     the house style, as measured values
templates/project/       what `init` writes
examples/wave/           the fixture
golden/voices/           per-engine house voice references
scripts/check.mjs        fast repository checks, no ffmpeg or browser
docs/explainer/          the kit's own film, the root project
```

## The skill

`skill/SKILL.md` is the procedure an agent follows when asked for an explainer
video. It is versioned with the kit. Install it once per machine:

```bash
ln -s ~/Work/jimmerioles/explainer-kit/skill ~/.agents/skills/explainer-video
```

When the kit moves, the symlink follows. When the workflow changes, the skill
changes in the same commit as the commands.

## Requirements

Node 22 or newer, FFmpeg with `loudnorm`, `ebur128`, `sidechaincompress`,
`deesser` and `ssim`, and a Chromium binary. The kit finds Playwright's managed
Chromium, or set `CHROME_PATH`. Run `explainer doctor` to check everything at
once, and `npm run check` for the fast repository checks.

Kokoro runs locally through `kokoro-js` on CPU. The first `narrate` downloads
the quantised ONNX model, about 300 MB. Later runs are offline. If `npm install`
fails while `onnxruntime-node` tries to fetch a CUDA binary, run:

```bash
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install --include=optional
```

The kit uses the CPU backend. Edge remains available by setting
`voice.engine: "edge"` in a project.

## Versioning

The kit is pinned per project: `config.json` records the version that produced
the film, and the skill states the version it targets. When the house style
changes, bump the kit and re-run the Wave fixture first. A project that pins an
old version keeps building the film it shipped. `CHANGELOG.md` records what
changed and why.
