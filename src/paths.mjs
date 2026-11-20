import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const KIT_ROOT = path.resolve(here, "..");
export const KIT_VERSION = JSON.parse(
  fs.readFileSync(path.join(KIT_ROOT, "package.json"), "utf8"),
).version;

export const CONFIG_REL = path.join("docs", "explainer", "config.json");

export function findProject(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, CONFIG_REL))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `No explainer project here. Looked for ${CONFIG_REL} from ${start}. Run "explainer init" first.`,
      );
    }
    dir = parent;
  }
}

export function projectPaths(root) {
  const explainer = path.join(root, "docs", "explainer");
  return {
    root,
    explainer,
    config: path.join(explainer, "config.json"),
    script: path.join(explainer, "script.json"),
    scenes: path.join(explainer, "scenes.js"),
    assets: path.join(explainer, "assets.js"),
    capture: path.join(explainer, "capture.mjs"),
    build: path.join(explainer, "build"),
    cache: path.join(root, ".cache", "explainer"),
    out: path.join(explainer, "build", "film.mp4"),
  };
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function rel(root, file) {
  return path.relative(root, file) || ".";
}
