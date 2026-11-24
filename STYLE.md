# House style

The rules that make two films feel like one series. They are not suggestions.
`verify` catches the mechanical ones. A human catches the rest.

## Runtime and shape

- Target 3:15 (195 seconds). Anything from 3:00 to 3:30 is acceptable.
- Ten chapters. One idea per chapter. If a chapter needs two ideas, it is two
  chapters or one idea is cut.
- Each chapter runs 15 to 25 seconds, which is 3 to 5 sentences at the house
  pace. The cold open may run 20 and the close may run 15.
- The film follows one concrete object from start to finish. In Wave it was a
  single key press. Pick the object before writing, and return to it at the end.
- The last line is the smallest true sentence in the film. Not a summary, not a
  call to action. A landing.

## Narration

- Second person. "You hold the key." Not "the user holds the key."
- Present tense. The film describes what is happening on screen now.
- Short declarative sentences. One clause is better than two. A sentence may
  start with "And" when it carries the rhythm forward.
- Concrete verbs: reads, paints, ducks, settles, snaps. Not "leverages",
  "enables", "empowers" or "seamlessly".
- Numbers only when they are true and load-bearing. "Sixty times a second"
  earns its place. "Blazing fast" does not.
- No hype, no exclamation marks, no rhetorical questions except the cold open.
- No em dashes. No double hyphens used as punctuation. Use a colon, a comma or
  a second sentence.
- Name the thing the viewer can see. If the narration says "the analyser" and
  the screen says "ORB", fix one of them.
- Read it aloud before recording. If a sentence is hard to say, it is hard to
  hear.

## Visual language

- 1920 × 1080, 30 fps, 16:9. No vertical cuts.
- Dark field (`#070a15`), warm ink (`#f4f1ea`), one accent (`#ff6a4d`) and four
  supporting hues. The accent marks the thing the narration is pointing at.
- Type: Space Grotesk for argument, Instrument Serif italic for one emphasized
  phrase per film at most, JetBrains Mono for labels, counters and code.
- Scale: 96 display, 64 chapter title, 32 body, 24 caption, 18 label, 14 chrome.
  Do not add a seventh size.
- Margins: 110 px left and right, 80 px top, 42 px bottom. The frame is a stage,
  not a poster.
- The chrome is furniture, not content: chapter counter top right, rule under
  it, three mono labels along the bottom.
- Every diagram must earn its motion. Build it as the sentence explains it.
- One match cut per film is enough. Two is a tic.
- No stock footage. No looping waveform videos. If the product makes a signal,
  draw the real signal. In Wave every orb, tick and spring came from the actual
  analyser.
- Screenshots are shown as objects on the stage: rounded corners, one shadow,
  slight zoom. Never full bleed.

## Motion

- Scene crossfade 0.55 seconds in, 0.55 out.
- Reveals 0.8 to 1.4 seconds, eased with smoothstep. Nothing linear, nothing
  bouncy except a spring that is representing a spring.
- Hold the last frame of a diagram for at least a second before the cut. The
  viewer needs time to finish reading.
- The film fades from black in 1.4 seconds and to black in 1.1 seconds.
- Motion is allowed to continue under silence. In Wave the stage kept breathing
  with the mute on.

## Audio

- One voice, Kokoro `af_heart`, speed 0.88. 24 kHz source, resampled to 48 kHz
  by the kit. Calm, measured, never theatrical. Edge is a fallback, never a
  second house voice.
- Voice chain: highpass 75, lowpass 12000, de-esser, presence cuts at 3.2 and
  7.5 kHz, a 160 Hz lift, gentle compression, then -16 LUFS.
- The house bed is the `tech` score: 100 BPM, A major, seed 1,
  rendered locally and extended to the film. It is original, deterministic and
  MIT licensed. The Wave fixture uses the same bed, trimmed to its length.
- A bed sits at -24.5 LUFS within 3 LU, with a true peak at or below -2 dBFS,
  48 kHz stereo, and lasts at least as long as the narration. `verify` checks all
  four. A bed mastered at -14 LUFS is not a house bed.
- Duck the bed under the voice at 0.06 threshold, 6:1, 20 ms attack, 300 ms
  release. Fade it out over the last 2.5 seconds.
- Master to -16.0 LUFS integrated. The limiter targets -2.5 dBFS true peak so
  the AAC stays at or below the -1.5 dBFS gate. AAC 192k.
- Silence is allowed. Do not fill every second with score.
- The bed is an asset with provenance, not a prompt. Record the engine, style,
  BPM, key, seed and license in `music.json`.

## Writing the script

`script.json`, one segment per chapter:

```json
{
  "id": "clock",
  "title": "The clock",
  "sentences": [
    "Time is the other instrument.",
    "The arpeggiator doesn't trust the page clock."
  ],
  "notes": "Arp steps, lookahead window, real timeout constants."
}
```

`notes` is for the shot, not the voice. It never gets narrated.

## The read-through

Before narrating, read the whole script out loud with a timer.

- Under 3:00: the film is thin. Add a chapter or slow down.
- Over 3:30: the film is doing too much. Cut a chapter, not a sentence.
- Any sentence you stumble on: rewrite it.
- Any paragraph with two ideas: split the chapter.
- Any adjective doing work a number could do: replace it.

## Do not

- Do not explain the architecture before showing the thing.
- Do not use a chapter to apologize for the product or list limitations.
- Do not put two type sizes of the same weight next to each other.
- Do not animate a list item by item faster than it can be read.
- Do not end on "Thanks for watching."
