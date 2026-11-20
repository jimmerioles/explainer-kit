import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function loadScript(project) {
  const file = path.join(project.explainer, "script.json");
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const raw = fs.readFileSync(file, "utf8");
  const script = JSON.parse(raw);
  if (!Array.isArray(script.segments) || !script.segments.length) {
    throw new Error("script.json needs a non-empty segments array");
  }
  const ids = new Set();
  script.segments = script.segments.map((seg, i) => {
    if (!seg.id) throw new Error(`Segment ${i} has no id`);
    if (ids.has(seg.id)) throw new Error(`Duplicate segment id "${seg.id}"`);
    ids.add(seg.id);
    if (!Array.isArray(seg.sentences) || !seg.sentences.length) {
      throw new Error(`Segment "${seg.id}" has no sentences`);
    }
    return {
      id: seg.id,
      title: seg.title ?? seg.id.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      sentences: seg.sentences.map((s) => String(s).trim()).filter(Boolean),
      notes: seg.notes ?? null,
    };
  });
  const hash = createHash("sha256")
    .update(
      JSON.stringify(
        script.segments.map((s) => ({ id: s.id, title: s.title, sentences: s.sentences })),
      ),
    )
    .digest("hex")
    .slice(0, 16);
  return { ...script, hash, file };
}

export function countSentences(script) {
  return script.segments.reduce((n, s) => n + s.sentences.length, 0);
}

export function wordCount(script) {
  return script.segments.reduce(
    (n, s) => n + s.sentences.reduce((m, t) => m + t.split(/\s+/).length, 0),
    0,
  );
}
