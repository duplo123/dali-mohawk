# Plan: "Create your own hunt" + multi-tenant routing

A phased plan for adding an admin "create your own hunt" feature: a prompt + destinations + instructions are turned into a fully-themed, personalized hunt by Claude, staged at a separate route.

Phased so each phase ships something testable, and the multi-tenant refactor is decoupled from the LLM-builder work.

---

## Phase 0 — Allowlists (foundation)

Two new files; pure data, no behavior change yet.

### `config/font-presets.js`

Curated list Claude must pick from. Each preset bundles a Google Fonts URL with the three `--font-*` slots used by `index.html`.

```js
export const FONT_PRESETS = {
  "medieval-fantasy": {
    label: "Medieval fantasy",
    fontStylesheetUrl: "https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap",
    fonts: {
      display: `"Pirata One", serif`,
      body: `"IM Fell English", Georgia, serif`,
      smallcaps: `"IM Fell English SC", Georgia, serif`,
    },
  },
  "space-opera":     { /* Orbitron / Exo / Audiowide */ },
  "storybook":       { /* Fredoka / Quicksand / Patrick Hand */ },
  "noir-detective":  { /* Special Elite / Cutive Mono / Cinzel */ },
  "botanical":       { /* Playfair Display / Cormorant / Caveat */ },
  // ~6–8 presets total
};
```

### `config/voice-presets.js`

Maps semantic voice IDs to ElevenLabs voice IDs + tuned `voice_settings`.

```js
export const VOICE_PRESETS = {
  monster:   { label: "Monster (gruff, weary)",      elevenLabsVoiceId: "...", voiceSettings: { stability: 0.45, style: 0.6, similarity_boost: 0.75, use_speaker_boost: true } },
  commander: { label: "Commander (authoritative)",   elevenLabsVoiceId: "...", voiceSettings: { /* ... */ } },
  pixie:     { label: "Pixie (whimsical, light)",    elevenLabsVoiceId: "...", voiceSettings: { /* ... */ } },
  narrator:  { label: "Narrator (warm, theatrical)", elevenLabsVoiceId: "...", voiceSettings: { /* ... */ } },
  // 5–8 presets
};
```

The actual ElevenLabs voice IDs need to be populated as a separate small commit before Phase 2.

---

## Phase 1 — Multi-tenant refactor (no UI changes yet)

Goal: the existing Mohawk hunt keeps working unchanged at `/`, but the data layer is ready to host more hunts.

### 1a. KV key namespacing — `lib/state.js`

- Add a `huntSlug` parameter (defaults to `"mohawk"`).
- KV key becomes `hunt:<slug>:state`.
- Add a one-time migration: if `hunt:state` exists and `hunt:mohawk:state` doesn't, copy on first read.

```js
export async function getState(huntSlug = "mohawk") { ... }
export async function setState(state, huntSlug = "mohawk") { ... }
```

### 1b. Theme storage — new `lib/theme.js`

- `getTheme(huntSlug)`: returns KV-stored theme if present (`hunt:<slug>:theme`), else falls back to `config/theme.js` for `slug === "mohawk"`.
- `setTheme(huntSlug, theme)`: writes to KV.
- `getClientTheme(huntSlug)`: same projection logic that's currently in `config/theme.js`'s `clientTheme()`.

### 1c. API routes — accept `?hunt=<slug>`

Each handler reads `req.query.hunt || "mohawk"` and passes through:

- `api/state.js`, `api/find.js`, `api/seed.js`
- `api/clue.js` — also pulls `systemPrompt` / `promptInstructions` from `getTheme(slug)` instead of the static import
- `api/tts.js` — KV audio key becomes `hunt:<slug>:audio:<loc>:<mode>`; voice ID + settings come from theme's `voicePreset` resolved through `VOICE_PRESETS`
- `api/config.js` — returns `getClientTheme(slug)`
- `api/admin/*.js` — slug-aware

### 1d. Frontend slug awareness — `index.html` + `admin.html`

- On boot, read `?hunt=<slug>` from URL. Store in a `HUNT_SLUG` constant.
- Append `?hunt=<slug>` to every fetch (and propagate through links).
- `/` with no slug = `mohawk`, fully backward compatible.

**Verification gate:** load `/` → Mohawk hunt works exactly as before. KV inspection shows `hunt:mohawk:state` key.

---

## Phase 2 — Builder endpoint

### `api/admin/build-hunt.js` (POST, admin-keyed)

**Request body:**

```json
{
  "slug": "halloween-2026",
  "userPrompt": "Spooky Halloween hunt for 8-year-olds in Salem MA",
  "destinations": [
    { "realName": "Salem Witch Museum", "region": "Old Town", "hint": "..." }
  ],
  "instructions": "Keep it lighthearted, no real horror"
}
```

**Server logic:**

1. Validate slug is unique (no existing `hunt:<slug>:theme`), URL-safe, not `mohawk`.
2. Build a Claude prompt that:
   - Provides the `theme` JSON schema as the contract.
   - Lists allowed `fontPreset` keys from `FONT_PRESETS` and `voicePreset` keys from `VOICE_PRESETS`.
   - Includes destinations + user prompt + instructions.
   - Demands **JSON-only output** matching the schema.
3. Call Claude (use `claude-sonnet-4-6` for this — it's structured generation, worth the upgrade from Haiku). Use the `tool_use` pattern with a `submit_hunt_theme` tool to force JSON shape.
4. Validate the response:
   - All required fields present (persona, scenario, copy, items, fontPreset, voicePreset).
   - `fontPreset` ∈ `FONT_PRESETS` keys; `voicePreset` ∈ `VOICE_PRESETS` keys.
   - Every `item.region` exists in `scenario.regions`.
   - Palette has the required tokens (`ink`, `parchment-1`, `oxblood`, etc.).
5. Expand `fontPreset` → `style.fontStylesheetUrl` + `style.fonts` server-side from the allowlist (Claude only picks the key, never types the URL).
6. Write theme to `hunt:<slug>:theme`. Seed items into `hunt:<slug>:state.locations`.
7. Return `{ slug, previewUrl: "/?hunt=<slug>" }`.

**Theme stored in KV** has the same shape as `config/theme.js` but adds two top-level fields:

- `fontPreset: "medieval-fantasy"` — kept around so the builder can re-edit
- `voicePreset: "monster"` — read by `api/tts.js` to look up voice ID + settings

---

## Phase 3 — Admin UI

Add a new section to `admin.html`:

### "Create a hunt" panel

- Slug input (with availability check)
- Big textarea: "Describe the hunt"
- Repeating destination rows: real name + region + optional hint
- Free-form "additional instructions" textarea
- Submit → calls `POST /api/admin/build-hunt`, shows progress (Claude takes 5–15s)
- On success: shows a "Preview" link to `/?hunt=<slug>` and an "Open admin" link to `/admin?hunt=<slug>&key=...`

### "Hunts" list

- New `GET /api/admin/hunts` lists slugs in KV (use `kv.keys("hunt:*:theme")`).
- Each row: slug, persona name, # items, # families, links to preview/admin/delete.

---

## Phase 4 — Optional polish (defer if you want to ship faster)

- "Regenerate persona only" / "regenerate copy only" buttons in the per-hunt admin (re-run Claude on a subset).
- Live preview iframe in the builder showing the theme as Claude streams it.
- Tag generated themes with the original prompt so they can be re-edited.

---

## Files touched (summary)

**New:**

- `config/font-presets.js`
- `config/voice-presets.js`
- `lib/theme.js`
- `api/admin/build-hunt.js`
- `api/admin/hunts.js` (list)

**Modified:**

- `lib/state.js` — slug param + migration
- `config/theme.js` — keep as the Mohawk fallback; move `clientTheme()` shape to `lib/theme.js`
- `api/state.js`, `api/find.js`, `api/seed.js`, `api/clue.js`, `api/tts.js`, `api/config.js`, `api/admin/*.js` — slug-aware
- `index.html`, `admin.html` — read `?hunt=` from URL, propagate to fetches
- `README.md` — document the multi-tenant model and presets

---

## Tradeoffs / open questions

- **Slug discovery is intentionally hidden** — anyone with a slug can play that hunt, but admin is still admin-keyed. Fine for family use; mention in README.
- **Costs**: each generated hunt is ~1 Claude call (Sonnet, ~$0.05). TTS is per-location-per-mode, same as today.
- **Voice presets need ElevenLabs IDs** — pick from your ElevenLabs library manually, or scaffold with placeholders to fill in.
- **Phase 1 is the long pole** — mechanical but touches every API file. Phase 2–3 are smaller. Commit Phase 1 separately so the refactor can be reviewed independently of the new feature.
