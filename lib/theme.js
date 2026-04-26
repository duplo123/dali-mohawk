import { kv } from "@vercel/kv";
import { theme as defaultTheme } from "../config/theme.js";
import { resolveFontPreset } from "../config/font-presets.js";
import { resolveVoicePreset } from "../config/voice-presets.js";
import { DEFAULT_HUNT_SLUG } from "./state.js";

function themeKey(huntSlug) {
  return `hunt:${huntSlug}:theme`;
}

// Server-side theme load. Returns the full theme object including
// sensitive fields (systemPrompt, promptInstructions). Use getClientTheme
// for anything that crosses to the browser.
//
// Resolution order:
//   1. KV-stored theme at hunt:<slug>:theme (built hunts)
//   2. config/theme.js for the default Mohawk slug (file-backed fallback)
//   3. null otherwise — caller should 404
export async function getTheme(huntSlug = DEFAULT_HUNT_SLUG) {
  const stored = await kv.get(themeKey(huntSlug));
  if (stored) return expandPresets(stored);
  if (huntSlug === DEFAULT_HUNT_SLUG) return defaultTheme;
  return null;
}

export async function setTheme(huntSlug, theme) {
  if (!huntSlug) throw new Error("huntSlug required");
  await kv.set(themeKey(huntSlug), theme);
}

// Client-safe projection: strips LLM prompt internals, omits items
// (those reach the client via /api/state, not /api/config), and
// expands any fontPreset into the concrete style fields the renderer
// reads from CSS custom properties.
export async function getClientTheme(huntSlug = DEFAULT_HUNT_SLUG) {
  const theme = await getTheme(huntSlug);
  if (!theme) return null;
  const { systemPrompt, promptInstructions, ...safePersona } = theme.persona;
  return {
    persona: safePersona,
    scenario: theme.scenario,
    style: theme.style,
    copy: theme.copy,
  };
}

// Resolves a hunt's TTS voice config:
//   - If theme.voicePreset is set and resolves to a real ElevenLabs voice ID,
//     use it.
//   - Otherwise fall back to the ELEVENLABS_VOICE_ID env var.
//   - If neither yields a usable voice ID, throw with a message that points
//     at the actual fix.
//
// Presets ship with REPLACE_WITH_ELEVENLABS_VOICE_ID placeholders so they're
// callable without breaking the deployment; this guard makes sure the
// placeholder never leaks to ElevenLabs.
const PLACEHOLDER_VOICE_ID = "REPLACE_WITH_ELEVENLABS_VOICE_ID";

export async function getVoiceConfig(huntSlug = DEFAULT_HUNT_SLUG) {
  const theme = await getTheme(huntSlug);
  const envVoiceId = process.env.ELEVENLABS_VOICE_ID;
  const envFallback = envVoiceId ? {
    voiceId: envVoiceId,
    voiceSettings: { stability: 0.45, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true },
  } : null;

  if (theme?.voicePreset) {
    const resolved = resolveVoicePreset(theme.voicePreset);
    if (!resolved) {
      throw new Error(`Unknown voicePreset "${theme.voicePreset}" for hunt "${huntSlug}"`);
    }
    if (resolved.voiceId && resolved.voiceId !== PLACEHOLDER_VOICE_ID) {
      return resolved;
    }
    if (envFallback) return envFallback;
    throw new Error(
      `voicePreset "${theme.voicePreset}" has no ElevenLabs voice ID configured — ` +
      `paste a real ID into config/voice-presets.js or set ELEVENLABS_VOICE_ID env var`
    );
  }

  if (envFallback) return envFallback;
  throw new Error(`No voice configured for hunt "${huntSlug}" (no voicePreset, no ELEVENLABS_VOICE_ID env)`);
}

// Built hunts store fontPreset / voicePreset keys; the renderer expects
// fully-expanded style.fontStylesheetUrl + style.fonts. Expand on read so
// upstream callers stay preset-agnostic.
function expandPresets(theme) {
  if (!theme.fontPreset) return theme;
  const fontFields = resolveFontPreset(theme.fontPreset);
  if (!fontFields) return theme;
  return {
    ...theme,
    style: {
      ...theme.style,
      fontStylesheetUrl: fontFields.fontStylesheetUrl,
      fonts: fontFields.fonts,
    },
  };
}
