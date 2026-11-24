# Third-party notices

The kit calls these packages, models, fonts and system tools at runtime. Keep
this file with the kit and with any distributed build. The package license files
are installed under `node_modules/` by `npm install`.

## Runtime packages

| Package | Version | License | Source |
| --- | --- | --- | --- |
| `kokoro-js` | 1.2.1 | Apache-2.0 | https://github.com/hexgrad/kokoro |
| `msedge-tts` | 2.1.1 | MIT | https://www.npmjs.com/package/msedge-tts |
| `playwright-core` | 1.65.1 | Apache-2.0 | https://github.com/microsoft/playwright |
| `sharp` | 0.35.5 | Apache-2.0 | https://github.com/lovell/sharp |
| `@huggingface/transformers` | 3.8.1 | Apache-2.0 | https://github.com/huggingface/transformers.js |
| `onnxruntime-node` | 1.21.0 | MIT | https://github.com/microsoft/onnxruntime |

`sharp` bundles the libvips runtime through `@img/sharp-libvips-linux-x64`
1.3.4, which is LGPL-3.0-or-later. If you redistribute the installed tree,
include the libvips license and source offer with it.

## Voice model

The Kokoro-82M model is Apache-2.0. The kit downloads the quantised ONNX model
on the first `narrate` and caches it outside the repository.

- Model: https://huggingface.co/hexgrad/Kokoro-82M
- Runtime: https://github.com/hexgrad/kokoro

Edge TTS is an optional fallback, not the house voice. The `msedge-tts` package
is MIT, but the Microsoft Edge endpoint is a separate service with its own terms.
Check those terms before relying on Edge for a commercial release.

## Fonts

The local fonts are licensed under the SIL Open Font License 1.1:

- Space Grotesk, Copyright 2018 The Space Grotesk Project Authors.
- Instrument Serif, Copyright 2020 The Instrument Serif Project Authors.
- JetBrains Mono, Copyright 2020 The JetBrains Mono Project Authors.

The full license and copyright lines are in [`fonts/OFL.txt`](fonts/OFL.txt).

## House music

The house `tech` score is an original recording distributed with the kit under
the MIT license, Copyright (c) 2026 Vincent Schmalbach. The project's
`docs/explainer/music.json` records the style, tempo, key, seed and level. The
Wave fixture uses the same bed, trimmed to its length.

## System tools

- **FFmpeg** is not bundled. It is licensed under the LGPL-2.1-or-later, with
  optional GPL parts depending on the build. Check your build's configuration at
  https://ffmpeg.org/legal.html.
- **Chromium** is not bundled. The kit drives the browser already installed on
  the machine, or the one managed by Playwright.

## Before a commercial release

1. Keep this file and `fonts/OFL.txt` with the project.
2. Check the license of the FFmpeg build on the machine that made the film.
3. Check the Edge terms if the film used the Edge fallback.
4. Keep each project's `music.json` and the kit version in the release notes.
