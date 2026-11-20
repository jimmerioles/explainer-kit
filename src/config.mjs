import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT, KIT_VERSION } from "./paths.mjs";

const DEFAULTS = JSON.parse(
  fs.readFileSync(path.join(KIT_ROOT, "config", "defaults.json"), "utf8"),
);

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export function deepMerge(base, override) {
  if (!isObject(base) || !isObject(override)) return override ?? base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isObject(value) && isObject(base[key]) ? deepMerge(base[key], value) : value;
  }
  return out;
}

const LOCKED = [
  "video",
  "voice.chain",
  "voice.rate",
  "voice.pitch",
  "voice.initialSilence",
  "voice.sentenceGap",
  "voice.segmentGap",
  "voice.tailSilence",
  "voice.lufs",
  "voice.truePeak",
  "voice.lra",
  "mix.bedGainDb",
  "mix.fadeOut",
  "mix.duck",
  "mix.master",
  "theme.colors",
  "theme.fonts",
  "theme.margins",
  "release",
];

function at(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function loadConfig(projectDir) {
  const file = path.join(projectDir, "docs", "explainer", "config.json");
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const project = JSON.parse(fs.readFileSync(file, "utf8"));
  const overridden = LOCKED.filter((key) => at(project, key) !== undefined);
  if (overridden.length) {
    throw new Error(
      `Project config overrides locked house-style keys: ${overridden.join(", ")}.\n` +
        `Those values come from the kit. Change them in the kit, not per project.`,
    );
  }
  const merged = deepMerge(DEFAULTS, project);
  if (project.theme?.accent) merged.theme.colors.coral = project.theme.accent;
  merged.kit = { version: KIT_VERSION, pinned: project.kit ?? null };
  merged.paths = {
    project: projectDir,
    explainer: path.join(projectDir, "docs", "explainer"),
  };
  if (merged.kit.pinned && merged.kit.pinned !== KIT_VERSION) {
    merged.kit.drift = true;
  }
  validate(merged);
  return merged;
}

function validate(c) {
  const fail = (msg) => {
    throw new Error(`Invalid config: ${msg}`);
  };
  if (!c.title) fail("title is required");
  const { video, voice, mix } = c;
  if (!video.width || !video.height) fail("video.width and video.height are required");
  if (!video.fps) fail("video.fps is required");
  if (!voice.name) fail("voice.name is required");
  if (!(mix.master.lufs <= 0)) fail("mix.master.lufs must be negative");
}

export function rendererConfig(config) {
  return {
    title: config.title,
    slug: config.slug ?? config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    fps: config.video.fps,
    width: config.video.width,
    height: config.video.height,
    theme: {
      colors: config.theme.colors,
      fonts: config.theme.fonts,
      chrome: config.theme.chrome,
      margins: config.theme.margins,
    },
  };
}

export { DEFAULTS };
