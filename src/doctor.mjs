import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { KIT_ROOT, KIT_VERSION } from "./paths.mjs";
import { chromePath } from "./browser.mjs";

function has(bin, args = ["-version"]) {
  try {
    execFileSync(bin, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function filters() {
  try {
    return execFileSync("ffmpeg", ["-hide_banner", "-filters"], { encoding: "utf8" });
  } catch {
    return "";
  }
}

export function doctor(project, config, log = console.log) {
  const rows = [];
  const check = (name, ok, detail = "") => rows.push({ name, ok, detail });

  const major = Number(process.versions.node.split(".")[0]);
  check("node >= 22", major >= 22, process.versions.node);
  check("ffmpeg", has("ffmpeg"), "");
  check("ffprobe", has("ffprobe"), "");

  const list = filters();
  for (const filter of ["loudnorm", "sidechaincompress", "ssim", "ebur128", "deesser"]) {
    check(`filter ${filter}`, list.includes(` ${filter} `), "");
  }

  try {
    check("chromium", true, chromePath());
  } catch (error) {
    check("chromium", false, error.message.split("\n")[0]);
  }

  const fontDir = path.join(KIT_ROOT, "fonts");
  const css = path.join(fontDir, "local.css");
  const woff = fs.existsSync(fontDir)
    ? fs.readdirSync(fontDir).filter((f) => f.endsWith(".woff2")).length
    : 0;
  check("fonts", fs.existsSync(css) && woff >= 12, `${woff} woff2 files`);

  for (const dep of ["msedge-tts", "playwright-core"]) {
    let ok = true;
    try {
      const file = path.join(KIT_ROOT, "node_modules", dep, "package.json");
      ok = fs.existsSync(file);
    } catch {
      ok = false;
    }
    check(`dependency ${dep}`, ok, "npm install");
  }

  if (config) {
    check("kit pin", !config.kit.drift, `project pins ${config.kit.pinned ?? "none"}, kit is ${KIT_VERSION}`);
    check("project config", true, path.relative(project.root, project.config));
  }

  for (const row of rows) {
    log(`${row.ok ? "ok  " : "FAIL"} ${row.name}${row.detail ? `  ${row.detail}` : ""}`);
  }
  const failed = rows.filter((r) => !r.ok);
  if (failed.length) {
    log(`\n${failed.length} check${failed.length === 1 ? "" : "s"} failed`);
    process.exitCode = 1;
  } else {
    log("\nenvironment is ready");
  }
  return rows;
}
