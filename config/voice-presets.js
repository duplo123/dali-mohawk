// Voice presets — semantic voice IDs the hunt builder picks from.
//
// Each preset maps a friendly key (e.g. "monster") to a specific ElevenLabs
// voice ID + tuned voice_settings. The LLM picks a preset KEY only —
// never raw ElevenLabs IDs — so the resulting hunt always uses an
// approved voice from your library.
//
// To populate: replace the `elevenLabsVoiceId` placeholders below with
// actual IDs from your ElevenLabs voice library
// (https://elevenlabs.io/app/voice-library). Settings can be tuned per-voice;
// the defaults match the original Grumblestone tuning.
//
// `label` is shown in admin UI and described to the LLM.

const DEFAULT_VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.75,
  style: 0.6,
  use_speaker_boost: true,
};

export const VOICE_PRESETS = {
  monster: {
    label: "Monster — gruff, weary, ogre-ish (e.g. Grumblestone)",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.45, style: 0.6 },
  },

  commander: {
    label: "Commander — authoritative, militaristic, no-nonsense",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.7, style: 0.35 },
  },

  pixie: {
    label: "Pixie — whimsical, light, fairy-tale playful",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.4, style: 0.7 },
  },

  narrator: {
    label: "Narrator — warm, theatrical, classic storyteller",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.6, style: 0.5 },
  },

  detective: {
    label: "Detective — gravelly, mid-century noir, cigarette-smoke voiceover",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.55, style: 0.55 },
  },

  pirate: {
    label: "Pirate — salty sea-captain, boisterous and weathered",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.4, style: 0.75 },
  },

  sage: {
    label: "Sage — calm, ancient, wise mentor",
    elevenLabsVoiceId: "REPLACE_WITH_ELEVENLABS_VOICE_ID",
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.7, style: 0.4 },
  },
};

// Used by the LLM prompt to enumerate valid choices.
export function voicePresetKeys() {
  return Object.keys(VOICE_PRESETS);
}

// Resolves a preset key into the ElevenLabs config api/tts.js needs.
// Returns null if the key is unknown.
export function resolveVoicePreset(key) {
  const preset = VOICE_PRESETS[key];
  if (!preset) return null;
  return {
    voiceId: preset.elevenLabsVoiceId,
    voiceSettings: preset.voiceSettings,
  };
}
