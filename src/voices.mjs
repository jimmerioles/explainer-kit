// Voice identity rules shared by config validation, narration and voicecheck.
// Kokoro names look like af_heart; Edge names look like en-US-AvaNeural.

const KOKORO_VOICE = /^(af|am|bf|bm|ef|em|ff|hf|hm|if|im|jf|jm|pf|pm|zf|zm)_/;
const EDGE_VOICE = /^[a-z]{2}-[A-Z]{2}-/;

export const VOICE_ENGINES = ["kokoro", "edge"];

export function isKokoroVoice(name) {
  return KOKORO_VOICE.test(name ?? "");
}

export function isEdgeVoice(name) {
  return EDGE_VOICE.test(name ?? "");
}

export function voiceNameMatches(engine, name) {
  if (engine === "kokoro") return isKokoroVoice(name);
  if (engine === "edge") return isEdgeVoice(name);
  return false;
}

export function resolveEngine(voice = {}) {
  if (voice.engine) return voice.engine;
  return isKokoroVoice(voice.name) ? "kokoro" : "edge";
}

export function voiceDescription() {
  return "Kokoro (for example af_heart) or Edge (for example en-US-AvaNeural)";
}
