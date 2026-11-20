import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { duration, loudness, probe } from "./audio.mjs";
import { ensureDir } from "./paths.mjs";
import { loadScript } from "./script.mjs";
import { stills } from "./render.mjs";

function ssim(golden, actual) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", golden, "-i", actual, "-lavfi", "[0:v][1:v]ssim", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const stderr = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = stderr.match(/All:([\d.]+)/);
  return match ? Number(match[1]) : null;
}

export async function verify(config, project, { fast = false, log = console.log } = {}) {
  const build = project.build;
  const film = path.join(build, "film.mp4");
  const timelineFile = path.join(build, "timeline.json");
  if (!fs.existsSync(film)) throw new Error("No film.mp4. Run `explainer master` first.");
  if (!fs.existsSync(timelineFile)) throw new Error("No timeline.json. Run `explainer narrate` first.");
  const timeline = JSON.parse(fs.readFileSync(timelineFile, "utf8"));
  const script = loadScript(project);
  const checks = [];
  const add = (name, ok, detail) => {
    checks.push({ name, ok, detail });
    log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
  };

  if (script.hash !== timeline.hash) {
    add("script matches narration", false, "script.json changed since the last narrate");
  } else {
    add("script matches narration", true, timeline.hash);
  }

  add("voice is the house voice", !timeline.voiceFallback, timeline.voice);

  const seconds = duration(film);
  add(
    "duration matches timeline",
    Math.abs(seconds - timeline.duration) <= config.verify.durationTolerance,
    `${seconds.toFixed(2)}s vs ${timeline.duration.toFixed(2)}s`,
  );

  if (config.targetSeconds) {
    add(
      "runtime target",
      Math.abs(seconds - config.targetSeconds) <= config.verify.targetTolerance,
      `${seconds.toFixed(0)}s, target ${config.targetSeconds}s ± ${config.verify.targetTolerance}s`,
    );
  }

  add("kit pin", !config.kit.drift, `pinned ${config.kit.pinned ?? "none"}, kit ${config.kit.version}`);

  const info = probe(film);
  const video = info.streams.find((s) => s.codec_type === "video");
  const audio = info.streams.find((s) => s.codec_type === "audio");
  const [num, den] = String(video?.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = den ? num / den : 0;
  add(
    "video format",
    video?.codec_name === "h264" &&
      video?.width === config.video.width &&
      video?.height === config.video.height &&
      Math.abs(fps - config.video.fps) < 0.01,
    `${video?.codec_name} ${video?.width}x${video?.height} ${fps}fps`,
  );
  add("audio format", audio?.codec_name === "aac", `${audio?.codec_name} ${audio?.sample_rate}Hz`);

  const chapters = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_chapters", "-of", "json", film],
    { encoding: "utf8" },
  );
  const count = JSON.parse(chapters).chapters.length;
  add("chapter count", count === timeline.segments.length, `${count} chapters`);

  const level = loudness(film);
  const target = config.mix.master.lufs;
  add(
    "loudness target",
    Math.abs(level.integrated - target) <= config.verify.lufsTolerance,
    `${level.integrated} LUFS, target ${target}`,
  );
  add(
    "true peak ceiling",
    level.truePeak <= config.verify.truePeakCeiling,
    `${level.truePeak} dBFS, ceiling ${config.verify.truePeakCeiling}`,
  );

  if (!fast) {
    const goldenRel = config.verify.golden;
    if (!goldenRel) {
      log("skip frame compare, no verify.golden configured");
    } else {
      const golden = path.resolve(project.explainer, goldenRel);
      if (!fs.existsSync(golden)) {
        add("golden frame", false, `missing ${goldenRel}`);
      } else {
        const dir = ensureDir(path.join(build, "verify"));
        const at = config.verify.frameAt;
        await stills(config, project, { at: [at], log: () => {} });
        const rendered = path.join(build, "stills", `t-${String(at.toFixed(2)).padStart(7, "0")}.png`);
        if (!fs.existsSync(rendered)) {
          add("golden frame", false, "still render produced no file");
        } else {
          const target = path.join(dir, "frame.png");
          fs.copyFileSync(rendered, target);
          const score = ssim(golden, target);
          add(
            "golden frame",
            score !== null && score >= config.verify.minSsim,
            score === null ? "ssim failed" : `ssim ${score.toFixed(4)} >= ${config.verify.minSsim}`,
          );
        }
      }
    }
  }

  const report = {
    title: timeline.title,
    hash: timeline.hash,
    kit: config.kit,
    seconds,
    loudness: level,
    checks,
  };
  fs.writeFileSync(path.join(build, "report.json"), JSON.stringify(report, null, 2));

  const failed = checks.filter((c) => !c.ok);
  log(
    failed.length
      ? `\n${failed.length} check${failed.length === 1 ? "" : "s"} failed`
      : `\nall ${checks.length} checks passed`,
  );
  if (failed.length) process.exitCode = 1;
  return report;
}
