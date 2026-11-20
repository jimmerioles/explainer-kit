#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { findProject, projectPaths, ensureDir, KIT_VERSION } from "../src/paths.mjs";
import { loadConfig } from "../src/config.mjs";
import { narrate } from "../src/narrate.mjs";
import { renderFilm, stills } from "../src/render.mjs";
import { mixAudio } from "../src/mix.mjs";
import { masterFilm } from "../src/master.mjs";
import { verify } from "../src/verify.mjs";
import { voicecheck } from "../src/voicecheck.mjs";
import { doctor } from "../src/doctor.mjs";
import { init } from "../src/init.mjs";
import { startServer } from "../src/server.mjs";
import { launch } from "../src/browser.mjs";
import { loadScript } from "../src/script.mjs";

const HELP = `explainer ${KIT_VERSION}

  explainer init --title "Film title" [--slug slug]
  explainer narrate   [--force]
  explainer capture
  explainer stills    [--at 3,22,39]
  explainer render
  explainer mix
  explainer master
  explainer build
  explainer verify    [--fast]
  explainer voicecheck [--update]
  explainer script
  explainer serve
  explainer doctor

Global: --project <dir>   run against another project
`;

function timestamp(seconds) {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function generateScriptDoc(config, project) {
  const script = loadScript(project);
  const timelineFile = path.join(project.build, "timeline.json");
  const timeline = fs.existsSync(timelineFile)
    ? JSON.parse(fs.readFileSync(timelineFile, "utf8"))
    : null;
  const lines = [`# ${script.title ?? config.title}`, ""];
  if (timeline) {
    lines.push(
      `${timestamp(timeline.duration)} at ${config.video.width} × ${config.video.height}, ` +
        `${config.video.fps} fps. Voice ${timeline.voice}.`,
      "",
      "| Time | Chapter |",
      "| --- | --- |",
    );
    timeline.segments.forEach((seg) => {
      lines.push(`| ${timestamp(seg.start)} | ${seg.title ?? seg.id} |`);
    });
    lines.push("");
  }
  for (const seg of script.segments) {
    const built = timeline?.segments.find((s) => s.id === seg.id);
    lines.push(`## ${built ? `${timestamp(built.start)} · ` : ""}${seg.title}`, "");
    for (const sentence of seg.sentences) lines.push(`> ${sentence}`, "");
    if (seg.notes) lines.push(seg.notes, "");
  }
  const out = path.join(ensureDir(project.build), "script.md");
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`script ${path.relative(project.root, out)}`);
}

async function capture(config, project) {
  const out = ensureDir(path.join(project.explainer, "assets"));
  if (!config.capture?.url) throw new Error("Set capture.url in config.json, or add docs/explainer/capture.mjs");
  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: config.capture.viewport ?? { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    if (fs.existsSync(project.capture)) {
      const hook = await import(`${new URL(`file://${project.capture}`).href}?t=${Date.now()}`);
      const files = await hook.default({ page, config, out, project });
      console.log(`captured ${files.join(", ")}`);
    } else {
      await page.goto(config.capture.url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      const selector = config.capture.selector ?? "body";
      const target = path.join(out, "app.png");
      await page.locator(selector).screenshot({ path: target });
      console.log(`captured ${path.relative(project.root, target)}`);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      project: { type: "string" },
      title: { type: "string" },
      slug: { type: "string" },
      force: { type: "boolean" },
      fast: { type: "boolean" },
      update: { type: "boolean" },
      at: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const command = positionals[0] ?? "help";
  if (values.help || command === "help" || command === "version") {
    console.log(command === "version" ? KIT_VERSION : HELP);
    return;
  }

  if (command === "init") {
    init(path.resolve(values.project ?? process.cwd()), {
      title: values.title,
      slug: values.slug,
      force: Boolean(values.force),
    });
    return;
  }

  let root;
  try {
    root = findProject(values.project ?? process.cwd());
  } catch (error) {
    if (command === "doctor") {
      doctor(null, null);
      return;
    }
    throw error;
  }
  const project = projectPaths(root);
  const config = loadConfig(root);

  if (command === "doctor") return doctor(project, config);
  if (command === "narrate") return void (await narrate(config, project, { force: Boolean(values.force) }));
  if (command === "capture") return capture(config, project);
  if (command === "stills") {
    const at = values.at
      ? values.at.split(",").map(Number).filter(Number.isFinite)
      : [];
    return void (await stills(config, project, { at }));
  }
  if (command === "render") return void (await renderFilm(config, project));
  if (command === "mix") return void mixAudio(config, project);
  if (command === "master") return void masterFilm(config, project);
  if (command === "script") return generateScriptDoc(config, project);
  if (command === "verify") return void (await verify(config, project, { fast: Boolean(values.fast) }));
  if (command === "voicecheck") {
    return void (await voicecheck(config, { update: Boolean(values.update) }));
  }
  if (command === "build") {
    await narrate(config, project, { force: Boolean(values.force) });
    await renderFilm(config, project);
    mixAudio(config, project);
    masterFilm(config, project);
    return;
  }
  if (command === "serve") {
    const server = await startServer(project);
    console.log(`preview ${server.url}`);
    await new Promise((resolve) => {
      process.on("SIGINT", resolve);
      process.on("SIGTERM", resolve);
    });
    await server.close();
    return;
  }

  console.log(HELP);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  if (process.env.EXPLAINER_DEBUG) console.error(error);
  process.exit(1);
});
