import fs from "node:fs";
import path from "node:path";
import { duration, loudness } from "./audio.mjs";

// The music bed is a project asset. Inspect it the same way in mix and verify,
// so a missing, short or badly mastered bed cannot slip through one command.

export function bedPath(config, project) {
  const rel = config.mix.bed;
  return rel ? path.resolve(project.explainer, rel) : null;
}

export function inspectBed(config, project, { filmSeconds = null } = {}) {
  const file = bedPath(config, project);
  if (!file) {
    return {
      configured: false,
      ok: true,
      file: null,
      seconds: null,
      loudness: null,
      missing: false,
      tooShort: false,
      levelOk: true,
      peakOk: true,
      reason: "none configured",
    };
  }

  const name = path.relative(project.root, file);
  if (!fs.existsSync(file)) {
    return {
      configured: true,
      ok: false,
      file,
      name,
      seconds: null,
      loudness: null,
      missing: true,
      tooShort: false,
      levelOk: false,
      peakOk: false,
      reason: `missing ${name}`,
    };
  }

  const seconds = duration(file);
  const level = loudness(file);
  const target = config.mix.bedTargetLufs;
  const tolerance = config.verify.bedLufsTolerance;
  const peakCeiling = config.mix.bedPeakCeiling;
  const tooShort =
    Number.isFinite(filmSeconds) &&
    seconds < filmSeconds - config.verify.bedDurationTolerance;
  const levelOk =
    level.integrated !== null && Math.abs(level.integrated - target) <= tolerance;
  const peakOk = level.truePeak !== null && level.truePeak <= peakCeiling;

  const reasons = [];
  if (tooShort) {
    reasons.push(
      `${seconds.toFixed(2)}s is shorter than the ${Number(filmSeconds).toFixed(2)}s film`,
    );
  }
  if (!levelOk) {
    reasons.push(
      level.integrated === null
        ? "no integrated loudness"
        : `${level.integrated} LUFS is outside ${target} ± ${tolerance} LU`,
    );
  }
  if (!peakOk) {
    reasons.push(
      level.truePeak === null
        ? "no true peak"
        : `true peak ${level.truePeak} dBFS is above ${peakCeiling} dBFS`,
    );
  }

  return {
    configured: true,
    ok: reasons.length === 0,
    file,
    name,
    seconds,
    loudness: level,
    missing: false,
    tooShort,
    levelOk,
    peakOk,
    reason:
      reasons.length > 0
        ? reasons.join("; ")
        : `${name} ${seconds.toFixed(2)}s, ${level.integrated} LUFS, ${level.truePeak} dBFS`,
  };
}
