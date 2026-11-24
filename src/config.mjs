import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT, KIT_VERSION } from "./paths.mjs";
import {
  VOICE_ENGINES,
  resolveEngine,
  voiceDescription,
  voiceNameMatches,
} from "./voices.mjs";

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
  "voice.speed",
  "voice.sampleRate",
  "voice.initialSilence",
  "voice.sentenceGap",
  "voice.segmentGap",
  "voice.tailSilence",
  "voice.lufs",
  "voice.truePeak",
  "voice.lra",
  "mix.bedGainDb",
  "mix.bedTargetLufs",
  "mix.bedPeakCeiling",
  "mix.fadeOut",
  "mix.duck",
  "mix.master",
  "theme.colors",
  "theme.fonts",
  "theme.margins",
  "verify.lufsTolerance",
  "verify.truePeakCeiling",
  "verify.durationTolerance",
  "verify.targetTolerance",
  "verify.bedDurationTolerance",
  "verify.bedLufsTolerance",
  "verify.minSsim",
];

const PROJECT_KEYS = new Set([
  "kit",
  "title",
  "slug",
  "targetSeconds",
  "theme",
  "voice",
  "mix",
  "capture",
  "verify",
]);
const NESTED_KEYS = {
  theme: new Set(["chrome", "accent"]),
  voice: new Set(["engine", "name", "fallback"]),
  mix: new Set(["bed"]),
  verify: new Set(["golden", "frameAt"]),
};

function at(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function checkBlocks(project) {
  for (const block of ["voice", "mix", "verify", "theme", "capture"]) {
    if (project[block] !== undefined && !isObject(project[block])) {
      throw new Error(`Invalid config: ${block} must be an object`);
    }
  }
}

function checkUnknownKeys(project) {
  const unknown = Object.keys(project).filter((key) => !PROJECT_KEYS.has(key));
  for (const [block, allowed] of Object.entries(NESTED_KEYS)) {
    const value = project[block];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) unknown.push(`${block}.${key}`);
    }
  }
  if (unknown.length) {
    throw new Error(
      `Unknown project config keys: ${unknown.join(", ")}.\n` +
        "Use only the keys documented in README.md. A typo here would silently do nothing.",
    );
  }
}

export function loadConfig(projectDir) {
  const file = path.join(projectDir, "docs", "explainer", "config.json");
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const project = JSON.parse(fs.readFileSync(file, "utf8"));
  checkBlocks(project);
  const overridden = LOCKED.filter((key) => at(project, key) !== undefined);
  if (overridden.length) {
    throw new Error(
      `Project config overrides locked house-style keys: ${overridden.join(", ")}.\n` +
        `Those values come from the kit. Change them in the kit, not per project.`,
    );
  }
  checkUnknownKeys(project);
  const merged = deepMerge(DEFAULTS, project);
  if (merged.mix.bed === undefined) merged.mix.bed = null;

  const engine =
    project.voice?.engine === undefined && project.voice?.name
      ? voiceNameMatches("kokoro", project.voice.name)
        ? "kokoro"
        : "edge"
      : resolveEngine(merged.voice);
  const voiceDefaults =
    engine === "edge"
      ? { name: "en-US-AvaNeural", fallback: "en-US-EmmaNeural" }
      : { name: "af_heart", fallback: "af_bella" };
  merged.voice.engine = engine;
  if (!voiceNameMatches(engine, merged.voice.name)) {
    if (project.voice?.name) {
      throw new Error(
        `Invalid config: voice.name "${project.voice.name}" is not a ${engine} voice. ` +
          `Use ${voiceDescription()}, or set voice.engine to match the name.`,
      );
    }
    merged.voice.name = voiceDefaults.name;
  }
  if (!voiceNameMatches(engine, merged.voice.fallback)) {
    if (project.voice?.fallback) {
      throw new Error(
        `Invalid config: voice.fallback "${project.voice.fallback}" is not a ${engine} voice. ` +
          `Use ${voiceDescription()}, or set voice.engine to match the fallback.`,
      );
    }
    merged.voice.fallback = voiceDefaults.fallback;
  }

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
  if (typeof c.title !== "string" || !c.title.trim()) {
    fail("title must be a non-empty string");
  }
  if (!Number.isFinite(c.targetSeconds) || c.targetSeconds < 60) {
    fail("targetSeconds must be a number of at least 60");
  }
  if (!isObject(c.theme.chrome)) fail("theme.chrome must be an object");
  for (const key of ["left", "center", "right"]) {
    if (typeof c.theme.chrome[key] !== "string") {
      fail(`theme.chrome.${key} must be a string`);
    }
  }
  if (!/^#[0-9a-f]{6}$/i.test(c.theme.colors.coral)) {
    fail("theme.accent must be a six-digit hex color such as #ff6a4d");
  }
  const { video, voice, mix, verify } = c;
  if (!video.width || !video.height) fail("video.width and video.height are required");
  if (!video.fps) fail("video.fps is required");
  if (!VOICE_ENGINES.includes(voice.engine)) {
    fail(`voice.engine must be one of ${VOICE_ENGINES.join(", ")}`);
  }
  if (!voiceNameMatches(voice.engine, voice.name)) {
    fail(`voice.name must be a ${voice.engine} voice, not "${voice.name}"`);
  }
  if (!voiceNameMatches(voice.engine, voice.fallback)) {
    fail(`voice.fallback must be a ${voice.engine} voice, not "${voice.fallback}"`);
  }
  if (!(mix.master.lufs <= 0)) fail("mix.master.lufs must be negative");
  if (!(mix.master.truePeak <= 0)) fail("mix.master.truePeak must be negative");
  if (!Number.isFinite(mix.bedGainDb)) fail("mix.bedGainDb must be a number");
  if (!(mix.bedTargetLufs < 0)) fail("mix.bedTargetLufs must be negative");
  if (!(mix.bedPeakCeiling <= 0)) fail("mix.bedPeakCeiling must be negative");
  if (mix.bed !== null && typeof mix.bed !== "string") {
    fail("mix.bed must be a path inside docs/explainer, or null");
  }
  if (typeof mix.bed === "string") {
    if (path.isAbsolute(mix.bed)) fail("mix.bed must be relative to docs/explainer");
    const bed = path.resolve(c.paths.explainer, mix.bed);
    if (!bed.startsWith(c.paths.explainer + path.sep)) {
      fail("mix.bed must stay inside docs/explainer");
    }
  }
  if (typeof verify.golden !== "string" || !verify.golden) {
    fail("verify.golden must be a path inside docs/explainer");
  }
  if (path.isAbsolute(verify.golden)) {
    fail("verify.golden must be relative to docs/explainer");
  }
  const golden = path.resolve(c.paths.explainer, verify.golden);
  if (!golden.startsWith(c.paths.explainer + path.sep)) {
    fail("verify.golden must stay inside docs/explainer");
  }
  if (!Number.isFinite(verify.frameAt) || verify.frameAt < 0) {
    fail("verify.frameAt must be a non-negative number");
  }
  if (!(verify.minSsim > 0 && verify.minSsim <= 1)) {
    fail("verify.minSsim must be greater than 0 and at most 1");
  }
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
