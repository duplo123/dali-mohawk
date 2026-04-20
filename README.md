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

### The three config sections

#### 1. `persona` — the AI guide

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

#### 2. `scenario` — high-level branding

| Key | What it controls |
|---|---|
| `title` | App header title |
| `itemNoun` / `itemNounPlural` | Nouns for hunt targets ("treasure", "treasures") |
| `crewNoun` / `crewNounPlural` | Nouns for player groups ("crew", "crews") |
| `regions` | Map of region name → `{ emoji }` for location badges. Must include a `default` entry for fallback. |

#### 3. `copy` — every themed UI string

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
| `api/config.js` | Serves the client-safe theme subset to the browser |
| `api/clue.js` | Reads `theme.persona.systemPrompt` + `promptInstructions` to build LLM prompts |
| `api/tts.js` | Text-to-speech; persona-agnostic |
| `api/state.js`, `api/find.js`, `api/seed.js` | Hunt state (locations, families, finds) — stored in Vercel KV |
| `index.html` | Fetches `/api/config` on boot, populates static copy via `applyTheme()`, dynamic renderers read from `theme` |
| `admin.html` | Admin panel for managing families and state |

**Fallback**: if `/api/config` fails, `index.html` falls back to a generic default theme so the app stays usable.

---

## Not yet configurable

These are the next layers of the "creator-customizable" vision:

1. **Items / locations.** Currently seeded via `api/seed.js` and stored in KV. Next step: define the hunt set in config and have seed read from it.
2. **Styles.** Colors (`--ink`, `--sepia`, `--oxblood`) and fonts are hardcoded in `index.html`'s `<style>`. A `theme.style` block could emit these as inline CSS variables for per-scenario palettes.
3. **Internal state key `ogreCache`.** Legacy name in KV state — harmless but worth renaming to `guideCache` during a small migration.

---

## Running locally

```sh
vercel dev
```

Requires the following env vars (via `vercel env pull` or `.env.local`):

- `ANTHROPIC_API_KEY` — for the AI guide
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` — for text-to-speech
- Vercel KV credentials (auto-provisioned when you link the project)
