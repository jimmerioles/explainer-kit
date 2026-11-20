# Production

The recipe for one film, in order. Every step has a command and a way to know
it worked.

## 0. Preflight

```bash
explainer doctor
```

Everything must be `ok`. If Chromium is missing, set `CHROME_PATH` or install
Playwright's Chromium.

Decide the one object the film follows. Write it down. If you cannot say it in
one sentence, the film is not ready.

## 1. Scaffold

```bash
cd <project>
explainer init --title "Name, explained"
```

This writes `docs/explainer/` and appends build output to `.gitignore`. The
`kit` field records the version that will make the film.

## 2. Script

Write `script.json` from `STYLE.md`. Ten segments, one idea each, 3 to 5
sentences each. Put shot notes in `notes`, never in `sentences`.

Then read it out loud with a timer. The target is 3:15.

## 3. Narration

```bash
explainer narrate
```
Watch the per-sentence output. `cached` means the exact MP3 already exists and
the timeline is stable. `new` means the voice was fetched. The last line reports
speech time and film time against the target.

Check the voice did not fall back. If it did, `verify` will fail on purpose.

Once per session, or whenever the narration sounds off, compare the engine
against the house sample:

```bash
explainer voicecheck
```

It synthesizes one fixed sentence and compares duration and level with
`golden/voice.json`. `--update` re-baselines after a deliberate voice change.

The output is `build/narration.wav` at -16 LUFS and `build/timeline.json`. Every
scene is timed from that file. Do not hand-edit timings.

## 4. Look

```bash
explainer stills
```

One PNG per chapter at `start + 3s`, in `build/stills/`. Look at all ten. This is
the cheapest place to catch a layout that does not fit.

For a specific moment:

```bash
explainer stills --at 16,63.99,140.67
```

While iterating, `explainer serve` prints a preview URL. The renderer redraws at
30 fps from the same code that encodes.

## 5. Captures

Screenshots come from the real product, not a mockup. Set `capture.url` and
`capture.selector`, or replace `capture.example.mjs` with a hook that clicks,
types and waits for the state you need.

```bash
explainer capture
```

Save the captures in `docs/explainer/assets/` and name them in `assets.js`.

## 6. Music

Put the bed in `docs/explainer/music.m4a` and set `mix.bed`. It should already be
scored to the chapter timings, with a clean tail.

The kit applies the house gain, the ducking sidechain, the 2.5 second fade and
the master loudness. It does not write music.

## 7. Encode and mix

```bash
explainer render    # ~5 min for 3:15 at 1080p30
explainer mix
explainer master
```

`render` produces `build/video.webm` at 14 Mbps. That is the intermediate, not a
deliverable. `mix` produces `build/mix.wav` at -16 LUFS. `master` produces
`build/film.mp4` and `build/poster.jpg`.

## 8. Gates

```bash
explainer verify
```

All checks must pass. `build/report.json` records the numbers for the release.
`verify --fast` skips the frame comparison when you only changed audio.

If the frame check fails after a font or Chromium change, do not lower the
threshold. Fix the font loading, then regenerate the golden frame if the look
genuinely improved.

## 9. Publish

- Tag `explainer-vN`, following the project's existing pattern.
- Attach `film.mp4` to the release.
- Keep the MP4 out of Git. Keep `poster.jpg`, `script.json` and `config.json` in.
- If the README uses an inline player, the release asset URL goes there.
- Record the kit version in the release notes.

## 10. Before you call it done

- [ ] Ten chapters, 3:00 to 3:30, one idea each
- [ ] Every sentence says something the screen shows
- [ ] No em dashes in the narration
- [ ] The cold open shows the product within 15 seconds
- [ ] The last line lands, then silence
- [ ] `verify` passes with the frame check on
- [ ] Poster is a frame a stranger would click
- [ ] MP4 is a release asset, not a commit
- [ ] `config.json` pins the kit version that made it

## Failure modes

**Voice fetch fails after retries.** The kit falls back to `voice.fallback` and
marks the timeline. Re-run later, or pin a different voice deliberately. Do not
ship a fallback by accident.

**The timeline shifted.** You edited `script.json` after narrating. Re-run
`narrate`, then `render`. The script hash check exists to catch this.

**Text looks wrong in one frame.** A font did not load. Check the network log in
the renderer, then confirm the family names in `config/defaults.json` match
`fonts/local.css`. Fonts are served locally, so this is a path problem, not a
network problem.

**The encode throws a settings mismatch.** `render.json` and the canvas
disagree. The kit only supports 1920x1080 in this version.

**The mix clips or pumps.** Check `bedGainDb` and the ducking threshold in the
kit, not in the project. A bed mastered at -14 LUFS will fight the narration.

**Chapters are off by a second.** They come from segment starts, not scene
starts. Scene starts are pulled back by 0.9 seconds for the crossfade. Do not
edit `chapters.txt` by hand.

## Changing the house style

Change `config/defaults.json`, run the Wave fixture, compare against the golden
frame and loudness report, then bump the kit version. Projects keep the old
version until they choose to move. That is how a series stays coherent without
being frozen.
