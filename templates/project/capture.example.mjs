// Optional capture hook. Delete this file to use the default capture below.
//
// `explainer capture` opens `capture.url` in Chromium with the viewport from
// config, takes a still of `capture.selector`, and saves it to
// docs/explainer/assets/app.png. Replace this file when a project needs
// interaction (clicking a key, waiting for audio, recording a take).

export default async function capture({ page, config, out }) {
  await page.goto(config.capture.url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.locator(config.capture.selector).screenshot({
    path: `${out}/app.png`,
  });
  return ["app.png"];
}
