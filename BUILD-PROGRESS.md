# Phase 4: ElevenLabs TTS (Gate 3) — Grumblestone Speaks Aloud

## Build Progress

### DONE
- **`api/tts.js`** — GET endpoint `?locationId=X&mode=clue|success`. Reads the ogre text from `hunt:state`, checks a per-location KV key (`hunt:audio:{locationId}:{mode}`) for cached MP3 bytes, calls ElevenLabs `text-to-speech/{voice_id}` (model `eleven_multilingual_v2`) on cache miss, stores bytes base64-encoded in KV, and serves `audio/mpeg` with long-cache headers. Previously wired to Cartesia — swapped for ElevenLabs to access their monster/creature voice library.
- **`vercel.json`** — scoped the `no-store` Cache-Control rule to only the JSON endpoints (`state|find|seed|clue|admin/.*`), letting `/api/tts` set its own `public, max-age=31536000, immutable`.
- **`index.html`** — native `<audio controls preload="none">` element below each Grumblestone panel, pointing at `/api/tts?locationId=...&mode=...`.
- **`sw.js`** — cache bumped to `v3` so SW invalidates old shell.

### TODO
- **Env vars** — set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in Vercel production. Remove the old `CARTESIA_*` vars if they were set.
- **Deploy** — `vercel --prod`, then hard-reload to pick up new SW.
- **Smoke test** — tap play on a Grumblestone panel. First tap ~2–3s while ElevenLabs generates; subsequent taps from anyone serve from KV + edge cache.

---

# Phase 3: Grumblestone (Gate 2) — Ogre Persona Clues

## Build Progress

### DONE
- **`api/clue.js`** — POST endpoint. Body `{ locationId, mode: "clue"|"success" }`. Reads `hunt:state` from KV, checks `ogreCache[locationId][mode]` for a cache hit, otherwise calls Anthropic's Messages API (`claude-haiku-4-5`) with the Grumblestone system prompt, caches the result, and returns `{ text, cached }`. Graceful 502 on API failure so UI shows fallback.
- **`index.html`** ogre integration:
  - "🗣️ Ask Grumblestone" button on not-yet-found cards (hidden once commissioned)
  - Parchment-style scroll panel renders cached clue/success text under each card
  - Loading state (`*grumble grumble*` animate-pulse) while Gemini responds
  - Error state falls back to just the base clue
  - Success message auto-fires on find (fire-and-forget after POST /api/find)
  - In-memory `loadingOgre` Set + `ogreErrors` Map for per-card UI state

### TODO
- **Env var** — set `ANTHROPIC_API_KEY` in Vercel (`vercel env add ANTHROPIC_API_KEY production`). If `GEMINI_API_KEY` was previously set, it's no longer used and can be removed (`vercel env rm GEMINI_API_KEY production`).
- **Deploy** — `vercel --prod`
- **Smoke test** — tap "Ask Grumblestone" on a few cards, confirm cached on second family

---

# Phase 1: Gate 1 MVP — Mohawk Trail Hunt App

## Build Progress

### DONE
- **Step 1: Scaffold** — `package.json`, `vercel.json`, `.gitignore` created
- **Step 2: API routes** — All 6 serverless functions written and complete:
  - `api/state.js` — GET public state
  - `api/find.js` — POST record a find (public, idempotent)
  - `api/seed.js` — POST seed 8 locations (admin-keyed)
  - `api/admin/state.js` — GET/POST read state & toggle finds (admin-keyed)
  - `api/admin/family.js` — POST add/remove family (admin-keyed)
  - `api/admin/reset.js` — POST reset family or all (admin-keyed)
- **PWA shell** — `manifest.json` and `sw.js` created
- **Step 3: `index.html`** — Family-facing hunt page. Tailwind CDN + vanilla JS. Includes family picker (localStorage-backed), 8-card location grid with region-color badges, find flow with honor-system confirm modal + optimistic update, leaderboard with medals, and service worker registration.
- **Step 4: `admin.html`** — Admin screen. Key-gated (URL `?key=` or inline prompt). Family management (add/remove/reset), find-override matrix (family × location toggle grid), global reset with type-to-confirm, one-click seed, raw state JSON dump, toast notifications.
- **Vercel infra** — Project linked, KV (Upstash Redis) provisioned, `ADMIN_KEY` set, deployed to production.

### IN PROGRESS
- **Step 5 / 6: Seed + test** — Hit `/api/seed?key=<ADMIN_KEY>` to populate locations (or click the Seed button in admin.html after next deploy). Then add families and smoke-test the family flow.

### TODO
- **Step 5: Seed data** — Baked into `api/seed.js` already, just needs to be called after deploy.
- **Step 6: Deploy & test** — `npm install`, Vercel project setup (manual), deploy, seed, test.
- **Vercel infra (manual)** — `vercel login`, create project, add KV store, set `ADMIN_KEY` env var. Not done yet.

---

## Context

Building a PWA scavenger-hunt app for a Charlemont family weekend. The goal is a working, deployed MVP where families can pick their team, browse 8 locations with clues, mark finds (honor system), and see a leaderboard. An admin screen lets the organizer manage families and override finds. Stack: vanilla JS + Tailwind CDN (no build step), Vercel Serverless Functions, Vercel KV.

---

## File Structure

```
/
├── index.html          # Family-facing hunt PWA
├── admin.html          # Admin screen (password-gated)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (basic cache)
├── vercel.json         # Rewrites / function config
├── package.json        # Minimal — just @vercel/kv dependency
├── api/
│   ├── state.js        # GET /api/state — read hunt state
│   ├── find.js         # POST /api/find — record a find (family-side)
│   ├── admin/
│   │   ├── state.js    # GET/POST /api/admin/state — full read/write (admin-keyed)
│   │   ├── family.js   # POST /api/admin/family — add/remove family
│   │   └── reset.js    # POST /api/admin/reset — reset finds / nuke state
│   └── seed.js         # POST /api/seed — one-shot seed of locations (admin-keyed)
└── mohawk-hunt-plan.md # Existing plan doc
```

---

## Steps

### Step 1: Project scaffold & infra (manual + code)

**Manual (you do this):**
1. `vercel login` (if not already)
2. `vercel link` or `vercel` to create the project
3. In Vercel dashboard: add KV store, link to project
4. Set env vars: `ADMIN_KEY` (pick something non-obvious)
5. (Gemini/Cartesia keys not needed for Gate 1)

**Code (I write):**
- `package.json` — just `@vercel/kv` as a dependency
- `vercel.json` — clean URL routing, function config
- `.gitignore` — node_modules, .vercel

### Step 2: Data layer — API routes

All serverless functions in `/api`. Single KV key `hunt:state` holds the full JSON blob.

**`GET /api/state`** — Public. Returns the full state (families, locations, finds). No auth needed since there's nothing secret in the family view.

**`POST /api/find`** — Public. Body: `{ familyId, locationId }`. Appends to `finds[]` with timestamp. Validates familyId and locationId exist. Idempotent (skip if already found by this family).

**`POST /api/admin/family`** — Admin-keyed. Body: `{ action: "add"|"remove", name?, familyId? }`. Adds or removes a family (cascade-deletes finds on remove).

**`POST /api/admin/reset`** — Admin-keyed. Body: `{ scope: "family"|"all", familyId? }`. Clears finds for one family or everything.

**`GET /api/admin/state`** — Admin-keyed. Same as public state (for now).

**`POST /api/admin/state`** — Admin-keyed. Body: `{ familyId, locationId, found: bool }`. Toggle a specific find on/off.

**`POST /api/seed`** — Admin-keyed. One-shot: writes the 8 locations into state if `locations[]` is empty.

Admin auth: all `/api/admin/*` and `/api/seed` check `Authorization: Bearer <key>` or query param `?key=<key>` against `ADMIN_KEY` env var.

### Step 3: Family-facing PWA (`index.html`)

Single HTML file, Tailwind CDN, vanilla JS. Sections:

1. **Family picker** — On load, check `localStorage` for `familyId`. If none, show a dropdown of families fetched from `/api/state`. "Switch family" link in header.

2. **Location grid** — 8 cards in a responsive grid. Each card shows:
   - Map name (large), real name (small)
   - Region badge (color-coded: Western=amber, River=blue, Eastern=green)
   - Base clue text
   - State: "We found it!" button if not found, green check + timestamp if found by us, dimmed note if found by another family

3. **Find flow** — Tap "We found it!" → confirm modal ("Honor system — are you really here?") → `POST /api/find` → optimistic UI update → re-fetch state.

4. **Leaderboard** — Bottom section. Family name, find count, last find time. Manual refresh button.

5. **PWA shell** — `manifest.json` (name, icons, theme color, display: standalone), `sw.js` (cache index.html + Tailwind CDN for offline shell, network-first for API calls).

### Step 4: Admin screen (`admin.html`)

Separate HTML file. On load, reads `key` from URL query param, stores it for API calls.

- **Family management** — List families + find counts. "Add family" input + button. "Remove family" with confirm.
- **Find overrides** — Per family: 8 checkboxes (one per location) to toggle found/not-found.
- **Reset controls** — "Reset this family" and "Reset everything" (double-confirm).
- **Raw state** — Collapsible JSON dump for debugging.

### Step 5: Seed data

The 8 locations from the plan with base clues:

| Map name | Real name | Region | Base clue |
|---|---|---|---|
| The Marble Kingdom | Natural Bridge | Western | "Where pale stone remembers a forgotten quarry..." |
| The Giant's Canvas | MASS MoCA | Western | "A giant's gallery, too vast for any frame..." |
| The Giant's Soup Bowls | Glacial Potholes | River | "The river stirred its cauldron for ten thousand years..." |
| The Floating Garden | Bridge of Flowers | River | "A bridge that forgot it was a bridge, and became a garden..." |
| Guardian of the Sunrise | Hail to the Sunrise | River | "He has watched the eastern sky since before your grandparents' grandparents..." |
| The Medieval Watchtower | Poet's Seat Tower | Eastern | "Climb the tower where poets once whispered to the valley below..." |
| The Lost Train | Energy Park | Eastern | "Iron horses sleep here now, dreaming of the rails they once rode..." |
| The Watermill of Words | Montague Bookmill | Eastern | "A mill that once ground wheat now grinds stories instead..." |

Seed via `POST /api/seed` after first deploy.

### Step 6: Deploy & test

1. `npm install`
2. `vercel --prod` (or push to trigger auto-deploy)
3. Hit `/api/seed?key=<ADMIN_KEY>` to populate locations
4. Test on phone: family picker → browse locations → mark a find → check leaderboard
5. Test admin: add family, override finds, reset
6. Test "Add to Home Screen" on iOS/Android

---

## Verification

- [ ] `GET /api/state` returns seeded locations and empty finds
- [ ] Family picker shows families, selection persists in localStorage
- [ ] Location cards render with correct names, regions, clues
- [ ] "We found it!" flow records a find and updates UI
- [ ] Leaderboard reflects find counts
- [ ] Admin: add/remove family works, find overrides toggle correctly
- [ ] Admin: reset family / reset all works with confirmation
- [ ] PWA installable via "Add to Home Screen"
- [ ] Works on mobile Safari and Chrome
