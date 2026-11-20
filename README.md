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
  assets/         captures
  golden/         one reference frame for this film
```

Then:

```bash
explainer narrate    # TTS + cache -> narration.wav, timeline.json
explainer capture    # app stills for scenes.js
explainer stills     # one PNG per chapter, for looking at
explainer render     # WebCodecs -> video.webm
explainer mix        # narration + bed -> mix.wav at -16 LUFS
explainer master     # H.264, AAC, chapters, faststart -> film.mp4
explainer verify     # the gates
explainer voicecheck # does the pinned Edge voice still sound the same?
explainer script     # build/script.md, the companion doc
```

`explainer build` runs narrate, render, mix and master in one go. `verify` stays
a separate, deliberate step.

## What is locked

A project may set:

- `title`, `slug`, `targetSeconds`
- `voice.name` and `voice.fallback`
- `theme.chrome` (the three lines of frame furniture)
- `theme.accent` (one accent color, replaces coral)
- `mix.bed` (path to the music bed)
- `capture` (URL, selector, viewport)
- `verify` (golden frame, frame time, SSIM floor)

Everything else is the house style and lives in `config/defaults.json`: frame
size, fps, CRF, codec, voice chain, gaps, loudness targets, sidechain settings,
type families, margins, colors. The loader refuses a project config that tries
to change a locked key. That refusal is the point.

## Consistency gates

`verify` checks, and fails the build on:

1. **Script drift.** `script.json` changed after the last `narrate`.
2. **Voice drift.** The narration fell back to a non-house voice.
3. **Timing.** Film duration matches the timeline within 150 ms.
4. **Format.** H.264, 1920x1080, 30 fps, AAC 48 kHz.
5. **Chapters.** One chapter per segment.
6. **Loudness.** -16.0 LUFS integrated, within 0.3 LU.
7. **Peak.** True peak at or below -1.0 dBFS.
8. **Look.** A rendered frame at a fixed timestamp reaches SSIM 0.985 against
   the project's golden frame. Font fallback and spacing regressions fail here.

The narration cache is the quiet gate. Audio is keyed by a hash of the text
plus the voice settings, so re-renders reuse the exact same MP3s and the
timeline cannot drift. Delete `.cache/explainer/` to force a fresh read of the
voice.

## The Wave fixture

`examples/wave/` is the film this kit was extracted from. It is not a demo. It
is the end-to-end regression test: the kit must still reproduce the shipped
film from its own script, assets and cache.

```bash
explainer doctor --project examples/wave
explainer narrate --project examples/wave
explainer render --project examples/wave
explainer mix --project examples/wave
explainer master --project examples/wave
explainer verify --project examples/wave
```

Expected master: 195.13s, 1920x1080, 30 fps, -16.0 LUFS, ten chapters.

## Layout

```text
bin/explainer.mjs        the CLI
src/                     config, TTS, timeline, mix, master, render, verify
render/                  canvas frame, type system, primitives, chrome
fonts/                   local woff2, no network at render time
config/defaults.json     the house style, as measured values
templates/project/       what `init` writes
examples/wave/           the fixture
golden/                  the house voice reference
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
once.

## Versioning

The kit is pinned per project: `config.json` records the version that produced
the film, and the skill states the version it targets. When the house style
changes, bump the kit and re-run the Wave fixture first. A project that pins an
old version keeps building the film it shipped.
