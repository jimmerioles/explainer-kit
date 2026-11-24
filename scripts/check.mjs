#!/usr/bin/env node
// Fast repository checks that do not need ffmpeg, Chromium or a rendered film.
// Run with `npm run check`.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "build", ".cache", ".git", "golden", "fonts"]);
const CODE_DIRS = ["bin", "src", "render", "scripts", "templates", "docs/explainer", "examples"];
const DOC_FILES = ["README.md", "PRODUCTION.md", "STYLE.md", "skill/SKILL.md", "CHANGELOG.md"];

const RETIRED_BRAND = ["explain", "roo"].join("");
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const codeFiles = [];
const textFiles = new Set();
for (const rel of CODE_DIRS) {
  for (const file of walk(path.join(ROOT, rel))) {
    if (/\.(mjs|js|json|md)$/.test(file)) textFiles.add(file);
    if (/\.(mjs|js)$/.test(file)) codeFiles.push(file);
    if (file.endsWith(".json")) {
      try {
        JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (error) {
        fail(`${path.relative(ROOT, file)}: invalid JSON (${error.message})`);
      }
    }
  }
}

for (const file of codeFiles) {
  try {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  } catch (error) {
    const detail = String(error.stderr ?? error.message).trim().split("\n")[0];
    fail(`${path.relative(ROOT, file)}: ${detail}`);
  }
}

for (const rel of DOC_FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  textFiles.add(file);
  const text = fs.readFileSync(file, "utf8");
  if (text.includes("\u2014")) fail(`${rel}: contains an em dash`);
  if (text.includes("bin/explainer.js")) fail(`${rel}: uses bin/explainer.js instead of bin/explainer.mjs`);
  if (text.includes("capture.example.mjs")) fail(`${rel}: still refers to capture.example.mjs`);
}

for (const file of textFiles) {
  if (fs.readFileSync(file, "utf8").toLowerCase().includes(RETIRED_BRAND)) {
    fail(`${path.relative(ROOT, file)}: contains the retired brand name`);
  }
}

const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
for (const rel of ["docs/explainer/config.json", "examples/wave/docs/explainer/config.json"]) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  if (config.kit !== version) fail(`${rel}: pins ${config.kit}, package is ${version}`);
  if (!config.verify?.golden) fail(`${rel}: verify.golden is missing`);
}

const template = JSON.parse(
  fs.readFileSync(path.join(ROOT, "templates/project/config.json"), "utf8"),
);
if (!template.verify?.golden) fail("templates/project/config.json: verify.golden is missing");
if (!fs.existsSync(path.join(ROOT, "templates/project/capture.mjs"))) {
  fail("templates/project/capture.mjs is missing");
}
if (fs.existsSync(path.join(ROOT, "templates/project/capture.example.mjs"))) {
  fail("templates/project/capture.example.mjs is obsolete");
}

notes.push(`${codeFiles.length} code files checked`);
notes.push(`${DOC_FILES.filter((f) => fs.existsSync(path.join(ROOT, f))).length} docs checked`);
notes.push(`${textFiles.size} text files scanned for the retired brand`);

for (const note of notes) console.log(`ok   ${note}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) {
  console.error(`\n${failures.length} check${failures.length === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("all repository checks passed");
