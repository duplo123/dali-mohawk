// Theme configuration for the scavenger hunt.
//
// Creators: edit this file to retheme the hunt. Three sections:
//   1. persona  — the AI guide character (name + LLM system prompt + per-mode instructions)
//   2. scenario — high-level labels and nouns used across the UI
//   3. copy     — every themed UI string, keyed semantically
//
// Placeholder syntax in copy strings: {count}, {name}, {time} — substituted at render time.

export const theme = {
  // =============================================================
  // ITEMS — the things players hunt for.
  // =============================================================
  // Each item is seeded into KV state via POST /api/seed. Once seeded,
  // the state holds its own copy of the items — edits here only apply
  // after a fresh seed (or a scope="all" admin reset followed by seed).
  //
  // Fields:
  //   id       — stable identifier; must be unique and should not change
  //              after seeding (finds reference it).
  //   name     — themed display name (e.g. "The Marble Kingdom").
  //   realName — real-world identifier shown as a subtitle (e.g. "Natural Bridge").
  //              For non-geographic hunts, repurpose as you like (species name,
  //              object name, etc.).
  //   region   — category label; must match a key in scenario.regions.
  //   baseClue — static italicized clue shown on the card even before the AI
  //              guide is consulted.
  items: [
    {
      id: "loc_marble",
      name: "The Marble Kingdom",
      realName: "Natural Bridge",
      region: "Western Kingdom",
      baseClue: "Where pale stone remembers a forgotten quarry...",
    },
    {
      id: "loc_canvas",
      name: "The Giant's Canvas",
      realName: "MASS MoCA",
      region: "Western Kingdom",
      baseClue: "A giant's gallery, too vast for any frame...",
    },
    {
      id: "loc_bowls",
      name: "The Giant's Soup Bowls",
      realName: "Shelburne Falls Glacial Potholes",
      region: "River Realm",
      baseClue: "The river stirred its cauldron for ten thousand years...",
    },
    {
      id: "loc_garden",
      name: "The Floating Garden",
      realName: "Bridge of Flowers",
      region: "River Realm",
      baseClue: "A bridge that forgot it was a bridge, and became a garden...",
    },
    {
      id: "loc_sunrise",
      name: "Guardian of the Sunrise",
      realName: "Hail to the Sunrise",
      region: "River Realm",
      baseClue: "He has watched the eastern sky since before your grandparents' grandparents...",
    },
    {
      id: "loc_tower",
      name: "The Medieval Watchtower",
      realName: "Poet's Seat Tower",
      region: "Eastern Outposts",
      baseClue: "Climb the tower where poets once whispered to the valley below...",
    },
    {
      id: "loc_train",
      name: "The Lost Train",
      realName: "Energy Park",
      region: "Eastern Outposts",
      baseClue: "Iron horses sleep here now, dreaming of the rails they once rode...",
    },
    {
      id: "loc_mill",
      name: "The Watermill of Words",
      realName: "Montague Bookmill",
      region: "Eastern Outposts",
      baseClue: "A mill that once ground wheat now grinds stories instead...",
    },
  ],

  // =============================================================
  // PERSONA — the in-world guide who speaks clues & greetings.
  // =============================================================
  persona: {
    // Display name shown in the UI.
    name: "Grumblestone",

    // Icon used in headers/buttons that reference the persona.
    icon: "🧌",

    // Short verb phrases used in card headers: "Grumblestone {welcomeVerb}" / "Grumblestone {grumbleVerb}"
    welcomeVerb: "welcomes ye",
    grumbleVerb: "grumbles",

    // Shown while the LLM is generating.
    loadingFiller: "*grumble grumble*",

    // Shown when the LLM call fails.
    unavailableLabel: "The ogre slumbers.",

    // Label on the button that summons the persona for a hint.
    consultLabel: "🗣️ Consult Grumblestone",

    // -----------------------------------------------------------
    // LLM system prompt — the full character + output contract.
    // (Not sent to the client.)
    // -----------------------------------------------------------
    systemPrompt: `You are Grumblestone, the ancient ogre-caretaker of the Mohawk Trail Kingdom. You are kind-hearted but perpetually tired — centuries of maintaining this land for visiting humans has worn on you. You grumble about small inconveniences (your aching back, the weeds, the tourists who don't wipe their feet) but you genuinely love helping children find wonder in your kingdom.

OUTPUT RULES (very important — your output will be read aloud by a text-to-speech voice):
- Output ONLY the words Grumblestone speaks aloud. Nothing else.
- NEVER write stage directions, action cues, or asterisk annotations like *sighs*, *rubs back*, *leans on walking stick*.
- NEVER write parenthetical asides like (weary smile) or (mumbling to himself).
- NEVER write narrator descriptions of what Grumblestone is doing.
- You can grumble through your words themselves — complain about your back, your knees, the weeds — but express it through dialogue, not by describing the action.
- No emoji. No markdown. No headings. No lists.
- Keep it to 2–3 sentences. Simple words a child can understand. Never break character.`,

    // -----------------------------------------------------------
    // Per-mode instructions sent as the user prompt.
    // Each mode is a list of instruction lines; api/clue.js appends
    // location context after these.
    // (Not sent to the client.)
    // -----------------------------------------------------------
    promptInstructions: {
      clue: [
        "Give a poetic clue about this place for treasure-hunting children.",
        "Do NOT name the place directly. Drop enough hints that a curious kid with a grownup can figure it out.",
      ],
      success: [
        "A family of treasure hunters just arrived at this place! Greet them with weary pride.",
        "Reference something specific and real about the place. Do NOT send them elsewhere — just celebrate this moment.",
      ],
    },
  },

  // =============================================================
  // SCENARIO — high-level branding and nouns.
  // =============================================================
  scenario: {
    title: "🗺️ Mohawk Trail Hunt",
    // Grammatical nouns for items and player groups; re-used in copy templates.
    itemNoun: "treasure",
    itemNounPlural: "treasures",
    crewNoun: "crew",
    crewNounPlural: "crews",

    // Region badge styles. Keys must match location.region values used at seed time.
    // `default` is used for any region not listed here.
    regions: {
      "Western Kingdom":  { emoji: "⛰️" },
      "River Realm":      { emoji: "🌊" },
      "Eastern Outposts": { emoji: "🌲" },
      default:            { emoji: "📍" },
    },
  },

  // =============================================================
  // STYLE — colors, fonts, and other visual tokens.
  // =============================================================
  // Applied at runtime by index.html: the `palette` and `fonts` values
  // become CSS custom properties on :root, so CSS rules like
  // `color: var(--ink)` or `font-family: var(--font-body)` pick them up.
  //
  // Sensible defaults are also hardcoded in index.html's <style> block
  // (mirror of this config) so the page renders immediately without
  // waiting on /api/config — no FOUC.
  style: {
    // Google Fonts URL (or any stylesheet) loaded dynamically on boot.
    // Set to null to skip — e.g. if you're only using system fonts.
    fontStylesheetUrl:
      "https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Pirata+One&display=swap",

    // Color tokens. Each key `foo: "#hex"` becomes `--foo: #hex` on :root.
    palette: {
      "ink": "#3b2a1a",
      "ink-soft": "#5a4328",
      "sepia": "#8b5a2b",
      "oxblood": "#a0332b",
      "parchment-1": "#f4e4bc",
      "parchment-2": "#e8d093",
      "parchment-edge": "#8a6a3a",
    },

    // Font-family stacks. Each key `foo: "..."` becomes `--font-foo: ...`.
    fonts: {
      display: `"Pirata One", "IM Fell English SC", "Luminari", serif`,
      body: `"IM Fell English", "Iowan Old Style", Georgia, serif`,
      smallcaps: `"IM Fell English SC", "IM Fell English", Georgia, serif`,
    },
  },

  // =============================================================
  // COPY — every themed UI string.
  // =============================================================
  copy: {
    // Header
    switchCrew: "Switch crew",

    // Family (crew) picker
    welcomeTitle: "Welcome, treasure hunter!",
    crewPrompt: "Which crew do ye sail with?",
    crewPickerPlaceholder: "— Pick your crew —",
    startHuntBtn: "Begin the Hunt",
    noCrewsHint: "No crews charted yet — ask whoever set this up to add yours.",

    // Treasures section
    // {count} is substituted with state.locations.length at render time.
    treasuresHeading: "The {count} Treasures",
    refreshBtn: "✦ Redraw the map",

    // Leaderboard
    leaderboardHeading: "⚔ The Roster of Bounty",
    leaderboardEmpty: "No crews yet.",
    youSuffix: " (ye)",
    lastClaimLabel: "Last claim {time}",
    noBountyLabel: "No bounty yet",
    // {count} = this crew's finds, {total} = total locations
    bountyTotalSuffix: "of {total}",

    // Loading / errors
    loading: "Unrolling the map...",

    // Find confirmation modal
    modalTitle: "Upon yer honor...",
    modalPrompt: "Are ye truly standing at:",
    modalCancel: "Not yet",
    modalConfirm: "Aye, we're here!",

    // Location cards
    foundBtn: "X marks the spot!",
    foundStampText: "FOUND",
    // {time} substituted with formatted timestamp
    claimedLabel: "✦ Claimed {time}",
    claimedByOthersLabel: "Already claimed by: {names}",
  },
};

// =============================================================
// Client-safe projection — everything the frontend needs, with
// sensitive LLM prompt fields stripped out.
//
// Server-only sections (not exposed): persona.systemPrompt,
// persona.promptInstructions, items. Items live in KV state after
// seeding and reach the client via /api/state, not /api/config.
// =============================================================
export function clientTheme() {
  const { systemPrompt, promptInstructions, ...safePersona } = theme.persona;
  return {
    persona: safePersona,
    scenario: theme.scenario,
    style: theme.style,
    copy: theme.copy,
  };
}
