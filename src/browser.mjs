import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function firstExisting(candidates) {
  return candidates.find((p) => p && fs.existsSync(p)) ?? null;
}

export function chromePath() {
  if (process.env.CHROME_PATH) {
    if (!fs.existsSync(process.env.CHROME_PATH)) {
      throw new Error(`CHROME_PATH points at a missing file: ${process.env.CHROME_PATH}`);
    }
    return process.env.CHROME_PATH;
  }

  const cache = path.join(os.homedir(), ".cache", "ms-playwright");
  const managed = [];
  if (fs.existsSync(cache)) {
    for (const entry of fs.readdirSync(cache)) {
      if (!entry.startsWith("chromium-")) continue;
      managed.push(path.join(cache, entry, "chrome-linux64", "chrome"));
      managed.push(path.join(cache, entry, "chrome-linux", "chrome"));
    }
  }
  managed.sort().reverse();

  const system = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  const found = firstExisting([...managed, ...system]);
  if (!found) {
    throw new Error(
      "No Chromium found. Install one, or set CHROME_PATH to a Chrome or Chromium binary.\n" +
        "Playwright's own install works too: npx playwright install chromium",
    );
  }
  return found;
}

export async function launch() {
  const { chromium } = await import("playwright-core");
  return chromium.launch({
    executablePath: chromePath(),
    args: ["--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb"],
  });
}

export async function openFilm(browser, url, { echo = false } = {}) {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  const logs = [];
  page.on("console", (m) => {
    const line = `${m.type()}: ${m.text()}`;
    logs.push(line);
    if (echo) console.log(`  ${line}`);
  });
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 30000 });
  const error = await page.evaluate(() => window.__error ?? null);
  if (error) throw new Error(`Renderer failed to boot: ${error}\n${logs.join("\n")}`);
  const meta = await page.evaluate(() => window.__meta);
  return { page, meta, logs };
}
