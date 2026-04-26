// Skin presets — visual shells the hunt builder picks from.
//
// Where font-presets and voice-presets are small data bundles, a skin owns
// the entire visual shell of the player UI: body background, card style,
// button styles, header style, badges, FOUND stamp, scroll panel, etc.
//
// Each skin's CSS uses the same palette/font CSS variables the renderer
// always provides:
//   --ink, --ink-soft, --sepia, --oxblood,
//   --parchment-1, --parchment-2, --parchment-edge,
//   --font-display, --font-body, --font-smallcaps
//
// Token names are legacy from the original parchment look but apply to all
// skins as semantic slots:
//   parchment-1 = primary surface background
//   parchment-2 = secondary surface background
//   ink         = primary text
//   ink-soft    = secondary text
//   sepia       = secondary border / muted accent
//   oxblood     = primary accent (found, hover, "claim" button)
//   parchment-edge = border accent
//
// The builder picks colors that fit each chosen skin via the same CSS
// variables, so only the skin's CSS string changes between hunts.

const PARCHMENT_CSS = `
  body {
    background-color: var(--parchment-1);
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(255, 245, 210, 0.9) 0%, rgba(255, 245, 210, 0) 55%),
      radial-gradient(ellipse at 80% 90%, rgba(255, 245, 210, 0.6) 0%, rgba(255, 245, 210, 0) 55%),
      radial-gradient(ellipse at 50% 50%, rgba(244, 228, 188, 0) 40%, rgba(120, 85, 40, 0.35) 100%),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.29  0 0 0 0 0.20  0 0 0 0 0.10  0 0 0 0.10 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>"),
      linear-gradient(135deg, var(--parchment-1) 0%, var(--parchment-2) 100%);
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    box-shadow:
      inset 0 0 120px rgba(80, 50, 20, 0.45),
      inset 0 0 40px rgba(60, 35, 10, 0.35);
  }

  .card {
    background:
      radial-gradient(ellipse at 30% 20%, rgba(255, 250, 225, 0.7), rgba(255, 250, 225, 0) 60%),
      linear-gradient(135deg, #fbeecb 0%, #f0dba0 100%);
    border: 1.5px solid var(--sepia);
    box-shadow:
      inset 0 0 24px rgba(139, 90, 43, 0.18),
      0 2px 6px rgba(60, 35, 10, 0.25);
    border-radius: 6px;
    position: relative;
  }

  .card-tilt-left { transform: rotate(-0.6deg); }
  .card-tilt-right { transform: rotate(0.6deg); }

  .region-badge {
    font-family: var(--font-smallcaps);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 10px;
    padding: 4px 10px;
    border: 1px solid var(--ink);
    background: rgba(255, 245, 210, 0.5);
    color: var(--ink);
    border-radius: 2px;
  }

  .stamp-btn {
    font-family: var(--font-display);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: var(--oxblood);
    color: #fdf4d8;
    border: 2px solid #6b1f18;
    border-radius: 3px;
    padding: 10px 14px;
    box-shadow: 0 2px 0 #6b1f18, inset 0 0 12px rgba(0,0,0,0.25);
    transition: transform 0.08s ease;
  }
  .stamp-btn:hover { transform: translateY(-1px) rotate(-0.5deg); }
  .stamp-btn:active { transform: translateY(1px); box-shadow: 0 0 0 #6b1f18, inset 0 0 12px rgba(0,0,0,0.3); }

  .ink-btn {
    font-family: var(--font-smallcaps);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: rgba(139, 90, 43, 0.12);
    color: var(--ink);
    border: 1px dashed var(--sepia);
    border-radius: 3px;
    padding: 8px 12px;
    transition: background 0.15s;
  }
  .ink-btn:hover { background: rgba(139, 90, 43, 0.25); }

  .scroll-panel {
    background: linear-gradient(180deg, #f7e6b8 0%, #ead295 100%);
    border-left: 1px solid var(--sepia);
    border-right: 1px solid var(--sepia);
    color: var(--ink);
    padding: 14px 16px;
    margin-top: 12px;
    position: relative;
    clip-path: polygon(
      0% 6%, 4% 0%, 12% 4%, 22% 1%, 34% 5%, 48% 2%, 62% 6%, 76% 2%, 88% 6%, 96% 1%, 100% 5%,
      100% 94%, 96% 100%, 88% 95%, 76% 99%, 62% 94%, 48% 98%, 34% 95%, 22% 99%, 12% 96%, 4% 100%, 0% 94%
    );
  }

  .found-stamp {
    position: absolute;
    top: 8px;
    right: 8px;
    transform: rotate(-12deg);
    font-family: var(--font-display);
    font-size: 22px;
    letter-spacing: 0.15em;
    color: var(--oxblood);
    border: 3px double var(--oxblood);
    padding: 2px 10px;
    opacity: 0.85;
    pointer-events: none;
  }

  .map-header {
    background:
      linear-gradient(180deg, rgba(59, 42, 26, 0.95) 0%, rgba(80, 55, 30, 0.92) 100%);
    color: #f7e6b8;
    border-bottom: 2px solid var(--ink);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  .board-row {
    background: linear-gradient(135deg, #fbeecb 0%, #f0dba0 100%);
    border: 1px solid var(--sepia);
    border-radius: 4px;
  }
  .board-row.is-me {
    border-color: var(--oxblood);
    box-shadow: 0 0 0 1px var(--oxblood);
  }

  .trail-divider {
    height: 24px;
    background-image: radial-gradient(circle, var(--sepia) 1.5px, transparent 2px);
    background-size: 16px 24px;
    background-repeat: repeat-x;
    background-position: center;
    opacity: 0.6;
  }
`;

const NEON_GRID_CSS = `
  body {
    background-color: var(--parchment-1);
    background-image:
      linear-gradient(0deg, color-mix(in srgb, var(--parchment-edge) 8%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--parchment-edge) 8%, transparent) 1px, transparent 1px),
      radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--parchment-edge) 18%, transparent) 0%, transparent 60%),
      linear-gradient(180deg, var(--parchment-1) 0%, var(--parchment-2) 100%);
    background-size: 32px 32px, 32px 32px, 100% 100%, 100% 100%;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      color-mix(in srgb, var(--parchment-edge) 4%, transparent) 2px,
      color-mix(in srgb, var(--parchment-edge) 4%, transparent) 3px
    );
  }

  .card {
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--parchment-2) 90%, transparent) 0%,
      color-mix(in srgb, var(--parchment-1) 90%, transparent) 100%);
    border: 1px solid var(--parchment-edge);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--parchment-edge) 15%, transparent),
      0 0 24px color-mix(in srgb, var(--parchment-edge) 20%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    position: relative;
    backdrop-filter: blur(6px);
  }

  /* Skip the parchment-style tilt — neon grid wants perfect alignment. */
  .card-tilt-left, .card-tilt-right { transform: none; }

  .region-badge {
    font-family: var(--font-smallcaps);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 10px;
    padding: 4px 10px;
    border: 1px solid var(--parchment-edge);
    background: color-mix(in srgb, var(--parchment-edge) 8%, transparent);
    color: var(--parchment-edge);
    border-radius: 2px;
  }
  .region-badge::before { content: "[ "; opacity: 0.65; }
  .region-badge::after  { content: " ]"; opacity: 0.65; }

  .stamp-btn {
    font-family: var(--font-display);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: var(--oxblood);
    color: #fff;
    border: 1px solid var(--oxblood);
    border-radius: 2px;
    padding: 10px 14px;
    box-shadow:
      0 0 18px color-mix(in srgb, var(--oxblood) 50%, transparent),
      inset 0 0 12px rgba(255, 255, 255, 0.06);
    transition: box-shadow 0.15s, transform 0.08s;
  }
  .stamp-btn:hover { box-shadow: 0 0 28px color-mix(in srgb, var(--oxblood) 80%, transparent); transform: translateY(-1px); }
  .stamp-btn:active { box-shadow: 0 0 8px color-mix(in srgb, var(--oxblood) 30%, transparent); transform: translateY(1px); }

  .ink-btn {
    font-family: var(--font-smallcaps);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: transparent;
    color: var(--parchment-edge);
    border: 1px solid var(--parchment-edge);
    border-radius: 2px;
    padding: 8px 12px;
    transition: all 0.15s;
  }
  .ink-btn:hover {
    background: color-mix(in srgb, var(--parchment-edge) 10%, transparent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--parchment-edge) 35%, transparent);
  }

  .scroll-panel {
    background: color-mix(in srgb, var(--parchment-1) 70%, transparent);
    border: 1px solid var(--parchment-edge);
    border-radius: 2px;
    color: var(--ink);
    padding: 14px 16px;
    margin-top: 12px;
    position: relative;
    clip-path: none;
  }
  /* Corner brackets for "data terminal" feel */
  .scroll-panel::before, .scroll-panel::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid var(--parchment-edge);
  }
  .scroll-panel::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .scroll-panel::after  { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .found-stamp {
    position: absolute;
    top: 8px;
    right: 8px;
    transform: none;
    font-family: var(--font-display);
    font-size: 18px;
    letter-spacing: 0.25em;
    color: var(--oxblood);
    border: 1px solid var(--oxblood);
    padding: 2px 10px;
    opacity: 1;
    pointer-events: none;
    text-shadow: 0 0 8px color-mix(in srgb, var(--oxblood) 60%, transparent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--oxblood) 40%, transparent);
  }

  .map-header {
    background: color-mix(in srgb, var(--parchment-1) 92%, transparent);
    color: var(--ink);
    border-bottom: 1px solid var(--parchment-edge);
    box-shadow: 0 0 18px color-mix(in srgb, var(--parchment-edge) 25%, transparent);
  }

  .board-row {
    background: linear-gradient(135deg, var(--parchment-2) 0%, var(--parchment-1) 100%);
    border: 1px solid var(--parchment-edge);
    border-radius: 2px;
  }
  .board-row.is-me {
    border-color: var(--oxblood);
    box-shadow: 0 0 14px color-mix(in srgb, var(--oxblood) 45%, transparent);
  }

  .trail-divider {
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--parchment-edge) 20%,
      var(--parchment-edge) 80%,
      transparent 100%);
    background-size: auto;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.7;
  }
`;

export const SKIN_PRESETS = {
  parchment: {
    label: "Parchment treasure map",
    description:
      "Aged parchment paper with hand-inked borders, slightly tilted cards, torn-edge scroll panels, sepia and oxblood ink. Best for: medieval, fantasy, pirate, exploration, classic storybook themes. Pair with warm cream/amber/brown palette and serif/blackletter fonts.",
    css: PARCHMENT_CSS,
  },
  "neon-grid": {
    label: "Neon grid (cyberpunk / sci-fi terminal)",
    description:
      "Dark slate background with a faint glowing grid, scan-line overlay, sharp-cornered cards with cyan/magenta glow borders, bracketed badges, no rotation. Best for: sci-fi, cyberpunk, hacker, future, space, urban-tech themes. Pair with dark slate/navy primary backgrounds (parchment-1/-2 should be dark) and a bright neon accent in oxblood + parchment-edge.",
    css: NEON_GRID_CSS,
  },
};

export function skinPresetKeys() {
  return Object.keys(SKIN_PRESETS);
}

export function resolveSkinPreset(key) {
  const preset = SKIN_PRESETS[key];
  if (!preset) return null;
  return { css: preset.css };
}

// Used as the FOUC default in index.html — exported as a string literal
// so the browser can render before /api/config resolves.
export const DEFAULT_SKIN_KEY = "parchment";
