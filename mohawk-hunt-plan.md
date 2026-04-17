# The Quest for the Mohawk Trail Treasures — Build Plan

A PWA hunt-management app for the Charlemont family weekend. Honor-system based (no photos, no codes), with an optional ogre persona narrating clues via Gemini + Cartesia.

**Target build window:** Tonight, 7:30 PM – 10:45 PM (hard stop).
**Deploy target:** Vercel.
**Platform:** PWA installable to home screen on iOS/Android.

---

## Architecture

### Stack
- **Frontend:** Single-page PWA. Vanilla JS + Tailwind CDN. No build step.
  - `index.html` — family-facing hunt view
  - `admin.html` — admin view (gated by shared password in URL)
  - `manifest.json` + `sw.js` — makes it installable
- **Backend:** Vercel Serverless Functions in `/api`
  - `GET/POST /api/state` — read/write the hunt state
  - `POST /api/clue` — generate ogre-persona text via Gemini
  - `POST /api/tts` — proxy to Cartesia, return audio
- **Data store:** Vercel KV (Upstash Redis, free tier). Single key `hunt:state` holds the full JSON blob. Last-write-wins — fine for ~5 families.
- **Secrets (Vercel env vars):**
  - `GEMINI_API_KEY`
  - `CARTESIA_API_KEY`
  - `ADMIN_KEY` — shared password for admin screen, checked server-side

### Data model (single JSON blob in KV)
```json
{
  "families": [
    { "id": "fam_abc", "name": "The Smiths", "createdAt": "2026-04-18T..." }
  ],
  "locations": [
    {
      "id": "loc_marble",
      "name": "The Marble Kingdom",
      "realName": "North Adams Marble Arch",
      "region": "Western Kingdom",
      "baseClue": "Where pale stone remembers a forgotten quarry..."
    }
  ],
  "finds": [
    { "familyId": "fam_abc", "locationId": "loc_marble", "foundAt": "2026-04-19T..." }
  ],
  "ogreCache": {
    "loc_marble": { "clue": "...", "success": "...", "clueAudioUrl": "...", "successAudioUrl": "..." }
  }
}
```

### Security model
- Admin routes (`POST /api/state` for mutations beyond "record a find", all of `/admin.html`) require `?key=<ADMIN_KEY>` matching the env var.
- Family-side `POST /api/state` is limited to recording a find (append-only on `finds` array).
- Not production-grade auth. Good enough for a family weekend.

---

## The 8 Locations (from the map)

Hub-and-spoke from Charlemont home base. No gating — families can do them in any order.

| # | Map name | Real place | Region |
|---|---|---|---|
| 1 | The Marble Kingdom | North Adams Marble Arch / Natural Bridge | Western Kingdom |
| 2 | The Giant's Canvas | MASS MoCA | Western Kingdom |
| 3 | The Giant's Soup Bowls | Shelburne Falls Glacial Potholes | River Realm |
| 4 | The Floating Garden | Bridge of Flowers | River Realm |
| 5 | Guardian of the Sunrise | Hail to the Sunrise statue | River Realm |
| 6 | The Medieval Watchtower | Poet's Seat Tower, Greenfield | Eastern Outposts |
| 7 | The Lost Train | Energy Park, Greenfield | Eastern Outposts |
| 8 | The Watermill of Words | Montague Bookmill | Eastern Outposts |

---

## Features, in build order

### 1. Core hunt (must-have) — ~60 min

**Landing / family picker**
- First visit: dropdown of existing families → pick yours, or "none of these" prompts for the admin to add you.
- Stores `familyId` in `localStorage`.
- "Switch family" link in header for shared phones.

**Location grid**
- 8 cards, one per location. Shows map name prominently, real name smaller.
- Region badge (Western / River / Eastern).
- Card state:
  - **Not found** — shows base clue + "Ask the Ogre" button (stretch) + "We found it!" button.
  - **Found by us** — green check, timestamp, optional ogre congrats.
  - **Found by another family** — dimmed, shows which family found it first (just for fun, doesn't block you).

**Find flow**
- Tap "We found it!" → confirm modal ("Honor system — are you actually here?") → POST to `/api/state`, optimistic UI update.
- No photo, no code. Pure honor.

**Leaderboard**
- Simple list at bottom: family name, count of finds, last find time.
- Pull-to-refresh or manual refresh button. No live sync.

### 2. Admin screen (must-have) — ~30 min

Route: `/admin.html?key=<ADMIN_KEY>`

- **Families**
  - List all families with created-at timestamp and find count.
  - "Add family" — text input + button.
  - "Remove family" — with confirm; cascades to remove their finds from `finds[]`.
- **Finds overrides**
  - Per family: checklist of 8 locations, toggle to mark/unmark found.
  - "Reset this family" button (clears all their finds).
  - "Reset everything" nuclear option with double-confirm.
- **Raw state view** — collapsed JSON dump at the bottom for debugging.

### 3. Ogre persona clues (stretch) — ~45 min

**Persona prompt** (system prompt sent to Gemini Flash):

> You are Grumblestone, the ancient ogre-caretaker of the Mohawk Trail Kingdom. You are kind-hearted but perpetually tired — centuries of maintaining this land for visiting humans has worn on you. You grumble about small inconveniences (your aching back, the weeds, the tourists who don't wipe their feet) but you genuinely love helping children find wonder in your kingdom. Keep responses to 2–3 sentences. Use simple words children can understand. Never break character.
>
> When giving a clue: Describe the location poetically without naming it directly. Drop enough hints that a curious kid with a grownup can figure it out.
>
> When celebrating a find: Express weary pride. Reference something specific about the place.

**Flow**
- "Ask the Ogre" button on each not-yet-found card → `POST /api/clue` with `{ locationId, mode: "clue" }`.
- On find: auto-generate a success message with `mode: "success"`.
- **Cache generated text in `ogreCache`** keyed by location. First family to ask "commissions" the clue; everyone else sees the same one. Keeps the ogre's voice consistent and saves API calls.
- UI: text appears in a styled "scroll" component below the clue. Show "Grumblestone grumbles..." loading state.

**Model:** `gemini-2.5-flash` (cheap, fast, good enough for 2–3 sentence character text).

### 4. Cartesia TTS (stretch) — ~30 min

- "🔊 Hear the Ogre" button appears below any generated ogre text.
- `POST /api/tts` with `{ text, locationId, mode }` → server calls Cartesia, returns audio URL (or streams MP3/WAV bytes).
- Cache audio URL in `ogreCache.{locationId}.clueAudioUrl` / `.successAudioUrl` so repeat plays don't re-hit the API.
- `<audio>` element plays inline.
- **Voice selection:** browse Cartesia voice library tonight during setup — look for something gruff, weary, older. Jot the voice ID into an env var or a constant.

**Fallback:** If Cartesia integration breaks, the ogre text alone still works — TTS is pure polish.

---

## Build timeline (tonight)

| Time | Task | Cumulative |
|---|---|---|
| 7:30 – 7:45 | Vercel project init, KV provisioning, env vars set, repo pushed | 15 min |
| 7:45 – 8:45 | Core hunt: landing, family picker, location grid, find flow, leaderboard | 1h 15m |
| 8:45 – 9:15 | Admin screen: add/remove families, override finds, reset | 1h 45m |
| 9:15 – 9:30 | Deploy to Vercel, test on phone, seed 8 locations + ogre base text | 2h 00m |
| **9:30** | **Must-have cutoff. Ship-able as-is.** | |
| 9:30 – 10:15 | Gemini ogre integration + caching | 2h 45m |
| 10:15 – 10:45 | Cartesia TTS + audio caching | 3h 15m |
| **10:45** | **Hard stop. Whatever works, ships.** | |

---

## Ship-ability gates

The app is weekend-ready at each of these checkpoints. If something breaks, stop at the last green gate and go to bed.

- **Gate 1 (9:30 PM):** Core hunt + admin working on deployed URL. Seeded with 8 locations and static base clues. **This is the MVP — if nothing else ships, this ships.**
- **Gate 2 (10:15 PM):** Ogre text via Gemini working and cached. Clues feel magical even without audio.
- **Gate 3 (10:45 PM):** Cartesia TTS working. Full experience.

---

## Tomorrow morning checklist

- [ ] Verify app loads on at least 2 phones (iOS + Android if possible)
- [ ] "Add to Home Screen" works and launches full-screen
- [ ] Pre-seed all family names in admin before handing out the URL
- [ ] Share URL + family-pick instructions in a group text
- [ ] Admin key stays with you only
- [ ] Paper backup: print the map + location list as a fallback if anyone's phone dies

---

## Known risks

- **Vercel KV setup friction.** First-time setup can eat 10+ min. Budget flex. Alternative: Upstash directly, or a single JSON file in Vercel Blob storage.
- **Gemini / Cartesia API keys.** Make sure you have accounts + keys *before* 7:30 PM. Don't burn build time on account setup.
- **iOS PWA quirks.** "Add to Home Screen" on iOS has its own rules — test early, not at 10:40 PM.
- **Ogre going off-script.** Gemini Flash can occasionally break character. Temperature low (0.7), clear system prompt, 2–3 sentence cap enforced via `max_tokens`.
- **Kids discovering the admin URL.** Keep `ADMIN_KEY` non-obvious (not `admin` or `password`). Don't share it in the family group text.
