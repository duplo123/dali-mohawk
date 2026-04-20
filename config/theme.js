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
// =============================================================
export function clientTheme() {
  const { systemPrompt, promptInstructions, ...safePersona } = theme.persona;
  return {
    persona: safePersona,
    scenario: theme.scenario,
    copy: theme.copy,
  };
}
