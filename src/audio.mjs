import { execFileSync, spawnSync } from "node:child_process";

export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
}

export function ffmpeg(args, opts = {}) {
  return execFileSync("ffmpeg", ["-y", "-hide_banner", ...args], {
    encoding: "utf8",
    stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
    ...opts,
  });
}

export function probe(file) {
  return JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=format_name,duration,size,bit_rate:stream=codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels,channel_layout,pix_fmt,profile,level",
      "-of",
      "json",
      file,
    ]),
  );
}

export function duration(file) {
  const d = Number(probe(file).format.duration);
  if (!Number.isFinite(d)) throw new Error(`No duration for ${file}`);
  return d;
}

export function loudness(file, filter = "ebur128=peak=true") {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", filter, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const tail = out.split("Integrated loudness")[1] ?? "";
  const integrated = Number((tail.match(/I:\s+(-?[\d.]+) LUFS/) ?? [])[1]);
  const lra = Number((tail.match(/LRA:\s+(-?[\d.]+) LU/) ?? [])[1]);
  const peak = Number((out.match(/True peak:\s*\n\s*Peak:\s+(-?[\d.]+) dBFS/) ?? [])[1]);
  const tmp = Number((out.match(/Peak:\s+(-?[\d.]+) dBFS/) ?? [])[1]);
  return {
    integrated: Number.isFinite(integrated) ? integrated : null,
    lra: Number.isFinite(lra) ? lra : null,
    truePeak: Number.isFinite(peak) ? peak : Number.isFinite(tmp) ? tmp : null,
  };
}

export function measureLoudnorm(file) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const stderr = result.stderr ?? "";
  const json = stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
  if (!json) throw new Error(`Could not read loudnorm output for ${file}\n${stderr.slice(-400)}`);
  const parsed = JSON.parse(json);
  return {
    input_i: Number(parsed.input_i),
    input_tp: Number(parsed.input_tp),
    input_lra: Number(parsed.input_lra),
    input_thresh: Number(parsed.input_thresh),
    target_offset: Number(parsed.target_offset),
  };
}
