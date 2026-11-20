import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "./paths.mjs";
import { startServer } from "./server.mjs";
import { launch, openFilm } from "./browser.mjs";

export async function renderFilm(config, project, { log = console.log } = {}) {
  const build = ensureDir(project.build);
  const server = await startServer(project);
  const browser = await launch();
  try {
    log(`serving ${server.url}`);
    const { page, meta } = await openFilm(browser, `${server.url}/`, { echo: true });
    log(`timeline ${meta.duration.toFixed(2)}s, ${meta.frames} frames at ${config.video.fps}fps`);
    const name = `${config.slug ?? "film"}.webm`;
    const target = path.join(build, "video.webm");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 45 * 60 * 1000 }),
      page.evaluate(
        ({ fps, bitrate, name }) => window.startEncode({ fps, bitrate, name }),
        { fps: config.video.fps, bitrate: config.video.webmBitrate, name },
      ),
    ]);
    await download.saveAs(target);
    const size = fs.statSync(target).size;
    log(`video ${path.relative(project.root, target)} ${(size / 1e6).toFixed(1)} MB`);
    return { file: target, size, meta };
  } finally {
    await browser.close();
    await server.close();
  }
}

export async function stills(config, project, { at = [], log = console.log } = {}) {
  const build = ensureDir(project.build);
  const dir = ensureDir(path.join(build, "stills"));
  const server = await startServer(project);
  const browser = await launch();
  try {
    const { page, meta } = await openFilm(browser, `${server.url}/`);
    const times = at.length
      ? at
      : meta.timeline.segments.map((s) => Number((s.start + 3).toFixed(2)));
    const files = [];
    for (const t of times) {
      if (t < 0 || t > meta.duration) {
        log(`skip ${t}s, outside 0..${meta.duration.toFixed(1)}s`);
        continue;
      }
      await page.evaluate((time) => window.renderFrame(time), t);
      const file = path.join(dir, `t-${String(t.toFixed(2)).padStart(7, "0")}.png`);
      await page.locator("#stage").screenshot({ path: file });
      files.push(file);
      log(`still ${t.toFixed(2)}s ${path.relative(project.root, file)}`);
    }
    return files;
  } finally {
    await browser.close();
    await server.close();
  }
}
