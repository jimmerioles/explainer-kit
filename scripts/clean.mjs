#!/usr/bin/env node
// Remove generated build intermediates and narration caches, but keep the
// delivered film, poster, timeline and report. Run with `npm run clean`.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const KEEP = new Set(["film.mp4", "poster.jpg", "timeline.json", "report.json"]);

function size(target) {
  if (!fs.existsSync(target)) return 0;
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return stat.size;
  return fs
    .readdirSync(target)
    .reduce((total, entry) => total + size(path.join(target, entry)), 0);
}

function remove(target) {
  if (!fs.existsSync(target)) return 0;
  const bytes = size(target);
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed ${path.relative(ROOT, target)}`);
  return bytes;
}

let freed = 0;
const buildDirs = [path.join(ROOT, "docs/explainer/build")];
const examples = path.join(ROOT, "examples");
if (fs.existsSync(examples)) {
  for (const entry of fs.readdirSync(examples, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      buildDirs.push(path.join(examples, entry.name, "docs/explainer/build"));
    }
  }
}

for (const build of buildDirs) {
  if (!fs.existsSync(build)) continue;
  for (const entry of fs.readdirSync(build)) {
    if (KEEP.has(entry)) continue;
    freed += remove(path.join(build, entry));
  }
}

freed += remove(path.join(ROOT, ".cache/explainer"));
if (fs.existsSync(examples)) {
  for (const entry of fs.readdirSync(examples, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      freed += remove(path.join(examples, entry.name, ".cache/explainer"));
    }
  }
}

console.log(`freed ${(freed / 1e6).toFixed(1)} MB`);
