import fs from "node:fs";
import path from "node:path";
import { duration, ffmpeg, probe } from "./audio.mjs";
import { chaptersFor } from "./mix.mjs";

export function masterFilm(config, project, { log = console.log } = {}) {
  const build = project.build;
  const video = path.join(build, "video.webm");
  const audio = path.join(build, "mix.wav");
  const timelineFile = path.join(build, "timeline.json");
  if (!fs.existsSync(video)) throw new Error("No video.webm. Run `explainer render` first.");
  if (!fs.existsSync(audio)) throw new Error("No mix.wav. Run `explainer mix` first.");
  if (!fs.existsSync(timelineFile)) throw new Error("No timeline.json. Run `explainer narrate` first.");
  const timeline = JSON.parse(fs.readFileSync(timelineFile, "utf8"));
  const { file: chapters } = chaptersFor(project, timeline);
  const out = path.join(build, "film.mp4");
  const v = config.video;
  const sr = String(config.mix.master.sampleRate);

  const args = [
    "-v", "error",
    "-i", video,
    "-i", audio,
    "-i", chapters,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-map_metadata", "2",
    "-map_chapters", "2",
    "-vf", "scale=in_range=full:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709",
    "-c:v", "libx264",
    "-preset", v.preset,
    "-crf", String(v.crf),
    "-profile:v", v.profile,
    "-level", v.level,
    "-pix_fmt", v.pixelFormat,
    "-color_range", "tv",
    "-colorspace", "bt709",
    "-color_primaries", "bt709",
    "-color_trc", "bt709",
    "-c:a", "aac",
    "-b:a", v.audioBitrate,
    "-ar", sr,
    "-movflags", "+faststart",
    "-shortest",
    "-metadata", `title=${timeline.title ?? config.title}`,
    out,
  ];
  ffmpeg(args);

  const info = probe(out);
  const seconds = duration(out);
  if (Math.abs(seconds - timeline.duration) > 0.5) {
    throw new Error(`Master is ${seconds.toFixed(2)}s but the timeline is ${timeline.duration.toFixed(2)}s`);
  }
  log(
    `film ${path.relative(project.root, out)} ` +
      `${info.streams.find((s) => s.codec_type === "video").width}x` +
      `${info.streams.find((s) => s.codec_type === "video").height}, ` +
      `${seconds.toFixed(2)}s, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`,
  );

  const poster = path.join(build, "poster.jpg");
  const posterAt = config.verify.frameAt;
  ffmpeg(["-v", "error", "-ss", String(posterAt), "-i", out, "-frames:v", "1", "-q:v", "3", poster]);
  log(`poster ${path.relative(project.root, poster)} at ${posterAt}s`);
  return { file: out, seconds, loudness: null, poster };
}
