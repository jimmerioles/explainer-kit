# Changelog

## 1.1.0

- House voice moved to Kokoro `af_heart` at speed `0.88`, with `af_bella` as the
  fallback and per-engine goldens in `golden/voices/`.
- The root film and the Wave fixture use the house `tech` score at 100 BPM,
  A major, seed 1. The root bed is 201.8s; the fixture bed is trimmed to its
  length.
- `verify` now checks the configured voice with no fallback, H.264 `yuv420p`
  High@4.1, AAC 48 kHz stereo, chapter starts and titles, and the music bed's
  length, loudness and true peak. The limiter targets -2.5 dBFS so the encoded
  film stays at or below the -1.5 dBFS gate.
- `mix` refuses a bed that is shorter than the narration instead of padding it
  with silence.
- `master` converts the canvas's full-range video to standard limited-range
  H.264.
- Added `explainer golden` to lock the golden frame, and `npm run check` for
  fast syntax, JSON, config and prose checks.
- `init` writes a working `capture.mjs`, ignores both build output and the voice
  cache, and points at the golden step.
- Project config now rejects unknown keys, invalid voice names, absolute bed
  paths and gate overrides. Gate thresholds are house-owned.
- Removed the stale Edge golden files and the tracked Wave voice cache.
- Added `THIRD_PARTY_NOTICES.md` and the SIL Open Font License text in
  `fonts/OFL.txt`.
- Documented how a new project copies the canonical house bed from the root
  project, so no external music tool or research folder is needed.
