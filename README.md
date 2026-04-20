# Scavenger Hunt

A themed, AI-guided scavenger hunt that families play on their phones. Originally built for the Mohawk Trail, designed to be **rethemed by editing a single config file** — no code changes required to swap the persona, copy, regions, or scenario branding.

---

## Configuration approach

The hunt is driven by one source of truth: **[`config/theme.js`](./config/theme.js)**. Editing this file retheme's the entire experience — the AI guide's voice, every UI string, region badges, and scenario nouns.

```
┌─────────────────────┐
│ config/theme.js     │  ← creators edit this
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌──────────┐ ┌──────────┐
│api/clue  │ │api/config│
│(server)  │ │(to client)│
└──────────┘ └────┬─────┘
                  │  JSON (sensitive fields stripped)
                  ▼
             ┌──────────┐
             │index.html│
             └──────────┘
```

### The config sections

#### 1. `items` — the hunt targets

The list of things players hunt for. Each item: `{ id, name, realName, region, baseClue }`.

- `id` — stable identifier, never change after seeding (finds reference it)
- `name` — themed display name ("The Marble Kingdom")
- `realName` — real-world name shown as subtitle ("Natural Bridge"). Repurpose for non-geographic hunts (species name, object name, etc.)
- `region` — category label; must match a key in `scenario.regions`
- `baseClue` — static italicized clue shown on the card alongside the AI guide's output

Items are seeded into KV state via `POST /api/seed`. Edits here apply after a fresh seed — use admin's "reset all" then re-seed to re-initialize.

#### 2. `persona` — the AI guide

Defines *who* talks to players. Includes:

| Key | What it controls |
|---|---|
| `name` | Guide's display name (e.g. "Grumblestone") |
| `icon` | Emoji shown alongside the guide's name |
| `welcomeVerb` / `grumbleVerb` | Micro-copy for card headers: `"{name} {verb}"` |
| `loadingFiller` | Placeholder while the LLM generates |
| `unavailableLabel` | Shown on LLM errors |
| `consultLabel` | Label on the "ask the guide" button |
| `systemPrompt` | **Server-only.** The full LLM system prompt that defines the guide's character, voice, and output rules |
| `promptInstructions.clue` | **Server-only.** Instruction lines sent when generating a hint |
| `promptInstructions.success` | **Server-only.** Instruction lines sent when greeting players at a location |

`systemPrompt` and `promptInstructions` never reach the browser — `api/config` strips them via `clientTheme()` in `config/theme.js`.

#### 3. `scenario` — high-level branding

| Key | What it controls |
|---|---|
| `title` | App header title |
| `itemNoun` / `itemNounPlural` | Nouns for hunt targets ("treasure", "treasures") |
| `crewNoun` / `crewNounPlural` | Nouns for player groups ("crew", "crews") |
| `regions` | Map of region name → `{ emoji }` for location badges. Must include a `default` entry for fallback. |

#### 4. `style` — colors and fonts

- `fontStylesheetUrl` — Google Fonts (or other) stylesheet URL, injected on boot. Set to `null` to rely on system fonts only.
- `palette` — object of color tokens. Each `key: "#hex"` becomes `--key: #hex` as a CSS custom property on `:root`. Reference via `var(--ink)`, `var(--oxblood)`, etc. in CSS.
- `fonts` — object of font-family stacks. Each `key: "..."` becomes `--font-key`. Reference via `var(--font-display)`, `var(--font-body)`, `var(--font-smallcaps)`.

Defaults are also mirrored in `index.html`'s `<style>` block so the page renders without FOUC before `/api/config` resolves. When config loads, values are overridden on `:root` at runtime.

#### 5. `copy` — every themed UI string

Every user-facing string (buttons, headings, placeholders, empty states, modal copy) lives here. Placeholders use `{name}` syntax and are substituted at render time — e.g. `"The {count} Treasures"`, `"Already claimed by: {names}"`.

---

## Retheming examples

**Swap Grumblestone for a pirate captain:**

```js
persona: {
  name: "Captain Bartholomew",
  icon: "🏴‍☠️",
  welcomeVerb: "hails ye aboard",
  grumbleVerb: "mutters",
  consultLabel: "🦜 Ask the captain",
  systemPrompt: `You are Captain Bartholomew, a weathered pirate...`,
  // ...
}
```

**Change from a treasure hunt to a nature walk:**

```js
scenario: {
  title: "🌿 Forest Discovery",
  itemNounPlural: "discoveries",
  crewNoun: "group",
  regions: {
    "Woodlands": { emoji: "🌲" },
    "Meadow":    { emoji: "🌸" },
    default:     { emoji: "🔍" },
  },
},
copy: {
  treasuresHeading: "The {count} Discoveries",
  foundBtn: "We spotted it!",
  // ...
}
```

---

## Architecture

| File | Role |
|---|---|
| `config/theme.js` | Config source of truth. Exports `theme` (full, server-side) and `clientTheme()` (client-safe projection) |
| `lib/state.js` | Centralized KV state access. Exports `getState()` / `setState()`; handles lazy migration of legacy fields |
| `api/config.js` | Serves the client-safe theme subset to the browser |
| `api/seed.js` | Seeds `theme.items` into KV state (first run / post-reset) |
| `api/clue.js` | Reads `theme.persona.systemPrompt` + `promptInstructions` to build LLM prompts |
| `api/tts.js` | Text-to-speech; persona-agnostic |
| `api/state.js`, `api/find.js`, `api/admin/*.js` | Hunt state endpoints (all use `lib/state.js`) |
| `index.html` | Fetches `/api/config` on boot, applies style/copy via `applyTheme()`, dynamic renderers read from `theme` |
| `admin.html` | Admin panel for managing families and state |

**Fallback**: if `/api/config` fails, `index.html` falls back to a generic default theme so the app stays usable.

---

## Retheming a live hunt

**Changing copy, persona, style, or regions only** — no data migration needed. Edit `config/theme.js` and redeploy. Changes take effect on the next page load (client caches `/api/config` for 60s).

**Changing items** — items are snapshotted into KV state at seed time, so edits here require a re-seed. `api/seed.js` no-ops when `state.locations` is non-empty, so the flow is:

1. Clear state via KV or extend admin to expose a "clear locations" scope (not yet built — today `scope: "all"` preserves locations intentionally).
2. `POST /api/seed` re-reads `theme.items` and writes them into state.

A follow-up is adding a dedicated admin scope to clear locations without touching KV directly.

---

## Running locally

```sh
vercel dev
```

Requires the following env vars (via `vercel env pull` or `.env.local`):

- `ANTHROPIC_API_KEY` — for the AI guide
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` — for text-to-speech
- Vercel KV credentials (auto-provisioned when you link the project)
