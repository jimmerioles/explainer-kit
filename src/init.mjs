import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT, KIT_VERSION, CONFIG_REL } from "./paths.mjs";

const GITIGNORE = `# explainer build output and narration cache
docs/explainer/build/
.cache/explainer/
`;

function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export function init(root, { title, slug, force = false, log = console.log } = {}) {
  if (!title) throw new Error("Pass --title \"Film title\"");
  const projectSlug =
    slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const explainer = path.join(root, "docs", "explainer");
  const config = path.join(explainer, "config.json");

  if (fs.existsSync(config) && !force) {
    throw new Error(`${CONFIG_REL} already exists. Pass --force to overwrite the template files.`);
  }
  fs.mkdirSync(path.join(explainer, "assets"), { recursive: true });
  fs.mkdirSync(path.join(explainer, "golden"), { recursive: true });
  fs.mkdirSync(path.join(explainer, "build"), { recursive: true });

  const vars = { TITLE: title, SLUG: projectSlug, KIT_VERSION };
  const templateDir = path.join(KIT_ROOT, "templates", "project");
  for (const entry of fs.readdirSync(templateDir)) {
    const target = path.join(explainer, entry.replace(/\.example$/, ""));
    if (fs.existsSync(target) && !force) continue;
    fs.writeFileSync(target, fill(fs.readFileSync(path.join(templateDir, entry), "utf8"), vars));
  }

  const ignore = path.join(root, ".gitignore");
  const current = fs.existsSync(ignore) ? fs.readFileSync(ignore, "utf8") : "";
  if (!current.includes(".cache/explainer")) {
    fs.appendFileSync(ignore, (current.endsWith("\n") || !current ? "" : "\n") + GITIGNORE);
  }

  log(`created ${path.relative(root, explainer)} for "${title}" (kit ${KIT_VERSION})`);
  log("");
  log("next:");
  log("  1. write script.json: one segment per chapter, one sentence per line");
  log("  2. fill scenes.js and assets.js");
  log("  3. explainer narrate");
  log("  4. explainer stills   (inspect the look)");
  log("  5. explainer render && explainer mix && explainer master");
  log("  6. explainer verify");
  return projectSlug;
}
