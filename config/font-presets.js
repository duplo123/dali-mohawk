// Font presets — curated bundles the hunt builder picks from.
//
// Each preset bundles a Google Fonts stylesheet URL with the three font-family
// stacks the UI expects (--font-display, --font-body, --font-smallcaps).
// The LLM picks a preset KEY only — never raw URLs or font names — so the
// rendered output is always a known-good combination.
//
// To add a preset:
//   1. Pick 1–3 Google Fonts that work together.
//   2. Build the stylesheet URL at https://fonts.google.com/.
//   3. Add display/body/smallcaps stacks with a sensible system fallback.
//
// `label` is shown in admin UI and described to the LLM.

export const FONT_PRESETS = {
  "medieval-fantasy": {
    label: "Medieval fantasy — weathered, ornate, parchment-friendly",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Pirata+One&display=swap",
    fonts: {
      display: `"Pirata One", "IM Fell English SC", "Luminari", serif`,
      body: `"IM Fell English", "Iowan Old Style", Georgia, serif`,
      smallcaps: `"IM Fell English SC", "IM Fell English", Georgia, serif`,
    },
  },

  "space-opera": {
    label: "Space opera — futuristic, geometric, sci-fi",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Audiowide&family=Exo+2:wght@400;600&family=Orbitron:wght@500;700&display=swap",
    fonts: {
      display: `"Audiowide", "Orbitron", "Trebuchet MS", sans-serif`,
      body: `"Exo 2", "Helvetica Neue", Arial, sans-serif`,
      smallcaps: `"Orbitron", "Exo 2", Arial, sans-serif`,
    },
  },

  "storybook": {
    label: "Storybook — friendly, rounded, kid-forward",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Patrick+Hand&family=Quicksand:wght@400;600&display=swap",
    fonts: {
      display: `"Fredoka", "Patrick Hand", "Comic Sans MS", sans-serif`,
      body: `"Quicksand", "Helvetica Neue", Arial, sans-serif`,
      smallcaps: `"Patrick Hand", "Quicksand", Arial, sans-serif`,
    },
  },

  "noir-detective": {
    label: "Noir detective — typewriter, shadowy, mid-century mystery",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cutive+Mono&family=Special+Elite&display=swap",
    fonts: {
      display: `"Special Elite", "Cinzel", "Courier New", serif`,
      body: `"Cutive Mono", "Courier New", monospace`,
      smallcaps: `"Cinzel", "Special Elite", Georgia, serif`,
    },
  },

  "botanical": {
    label: "Botanical — elegant serif with handwritten accents, nature themes",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@500;700&display=swap",
    fonts: {
      display: `"Playfair Display", "Cormorant Garamond", Georgia, serif`,
      body: `"Cormorant Garamond", "Iowan Old Style", Georgia, serif`,
      smallcaps: `"Caveat", "Playfair Display", cursive`,
    },
  },

  "modern-sans": {
    label: "Modern sans — clean, neutral, urban-explorer feel",
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@500;700&display=swap",
    fonts: {
      display: `"Space Grotesk", "Inter", "Helvetica Neue", sans-serif`,
      body: `"Inter", "Helvetica Neue", Arial, sans-serif`,
      smallcaps: `"Space Grotesk", "Inter", Arial, sans-serif`,
    },
  },
};

// Used by the LLM prompt to enumerate valid choices.
export function fontPresetKeys() {
  return Object.keys(FONT_PRESETS);
}

// Resolves a preset key into the style fields the renderer expects.
// Returns null if the key is unknown — caller should fall back / error.
export function resolveFontPreset(key) {
  const preset = FONT_PRESETS[key];
  if (!preset) return null;
  return {
    fontStylesheetUrl: preset.fontStylesheetUrl,
    fonts: preset.fonts,
  };
}
