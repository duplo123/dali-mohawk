import { kv } from "@vercel/kv";
import { isValidSlug, DEFAULT_HUNT_SLUG, getState, setState } from "../../lib/state.js";
import { getTheme, setTheme } from "../../lib/theme.js";
import { FONT_PRESETS, fontPresetKeys } from "../../config/font-presets.js";
import { VOICE_PRESETS, voicePresetKeys } from "../../config/voice-presets.js";

// Palette tokens index.html's CSS reads via var(--ink), var(--parchment-1), etc.
// The LLM must produce a hex value for each.
const REQUIRED_PALETTE_TOKENS = [
  "ink", "ink-soft", "sepia", "oxblood",
  "parchment-1", "parchment-2", "parchment-edge",
];

const REQUIRED_COPY_KEYS = [
  "switchCrew", "welcomeTitle", "crewPrompt", "crewPickerPlaceholder",
  "startHuntBtn", "noCrewsHint", "treasuresHeading", "refreshBtn",
  "leaderboardHeading", "leaderboardEmpty", "youSuffix", "lastClaimLabel",
  "noBountyLabel", "bountyTotalSuffix", "loading", "modalTitle",
  "modalPrompt", "modalCancel", "modalConfirm", "foundBtn",
  "foundStampText", "claimedLabel", "claimedByOthersLabel",
];

const REQUIRED_PERSONA_KEYS = [
  "name", "icon", "welcomeVerb", "grumbleVerb", "loadingFiller",
  "unavailableLabel", "consultLabel", "systemPrompt",
];

function checkAdmin(req) {
  const key = req.query?.key || req.headers?.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

// Tool schema: forces Claude to return a JSON object matching the theme contract.
// Anthropic enforces input_schema, so most shape errors are caught before
// the response reaches our validator.
function buildToolSchema() {
  return {
    name: "submit_hunt_theme",
    description:
      "Submit a complete themed hunt configuration. The system will use this to render the player-facing app and drive the AI guide.",
    input_schema: {
      type: "object",
      required: ["fontPreset", "voicePreset", "persona", "scenario", "style", "copy", "items"],
      properties: {
        fontPreset: {
          type: "string",
          enum: fontPresetKeys(),
          description: "Which font preset best fits the theme. Pick exactly one key.",
        },
        voicePreset: {
          type: "string",
          enum: voicePresetKeys(),
          description: "Which AI guide voice best fits the theme. Pick exactly one key.",
        },
        persona: {
          type: "object",
          required: REQUIRED_PERSONA_KEYS,
          properties: {
            name: { type: "string", description: "Guide's display name" },
            icon: { type: "string", description: "Single emoji shown beside the guide's name" },
            welcomeVerb: { type: "string", description: "Verb phrase: \"{name} {welcomeVerb}\" — e.g. \"welcomes ye\"" },
            grumbleVerb: { type: "string", description: "Verb phrase used in card headers — e.g. \"grumbles\"" },
            loadingFiller: { type: "string", description: "Short in-character placeholder while LLM generates" },
            unavailableLabel: { type: "string", description: "In-character message shown on LLM error" },
            consultLabel: { type: "string", description: "Button text to summon the guide for a hint" },
            systemPrompt: {
              type: "string",
              description:
                "Full LLM system prompt defining the guide's character, voice, and output rules. Must include OUTPUT RULES that ban stage directions, asterisks, parentheticals, emoji, and markdown — output is read aloud by TTS. Keep clues to 2-3 sentences, kid-friendly.",
            },
            promptInstructions: {
              type: "object",
              required: ["clue", "success"],
              properties: {
                clue: {
                  type: "array",
                  items: { type: "string" },
                  description: "Instruction lines for the 'give me a clue' mode",
                },
                success: {
                  type: "array",
                  items: { type: "string" },
                  description: "Instruction lines for the 'family arrived' celebration mode",
                },
              },
            },
          },
        },
        scenario: {
          type: "object",
          required: ["title", "itemNoun", "itemNounPlural", "crewNoun", "crewNounPlural", "regions"],
          properties: {
            title: { type: "string", description: "App header title (may include a leading emoji)" },
            itemNoun: { type: "string", description: "Singular noun for hunt targets, e.g. 'treasure'" },
            itemNounPlural: { type: "string" },
            crewNoun: { type: "string", description: "Singular noun for player groups, e.g. 'crew'" },
            crewNounPlural: { type: "string" },
            regions: {
              type: "object",
              description:
                "Map of region name -> { emoji }. Must include a 'default' key as fallback. Region names should match those used in items[].region.",
              additionalProperties: {
                type: "object",
                required: ["emoji"],
                properties: { emoji: { type: "string" } },
              },
            },
          },
        },
        style: {
          type: "object",
          required: ["palette"],
          properties: {
            palette: {
              type: "object",
              description: `Hex color tokens. Required keys: ${REQUIRED_PALETTE_TOKENS.join(", ")}. Each value must be a valid CSS hex color.`,
              required: REQUIRED_PALETTE_TOKENS,
              additionalProperties: { type: "string" },
            },
          },
        },
        copy: {
          type: "object",
          required: REQUIRED_COPY_KEYS,
          description:
            "Every themed UI string. Use {count}, {name}, {time}, {names}, {total} placeholders where the originals do.",
          additionalProperties: { type: "string" },
        },
        items: {
          type: "array",
          description:
            "One entry per destination passed in. Use the realName the user provided, but invent a themed `name` and `baseClue` and assign a `region` matching one in scenario.regions.",
          items: {
            type: "object",
            required: ["id", "name", "realName", "region", "baseClue"],
            properties: {
              id: {
                type: "string",
                description: "Stable URL-safe identifier, e.g. 'loc_witch_museum'. Must be unique within this hunt.",
              },
              name: { type: "string", description: "Themed display name" },
              realName: { type: "string", description: "Real-world name as provided by the user" },
              region: { type: "string", description: "Must match a key in scenario.regions" },
              baseClue: { type: "string", description: "Static italicized hint shown on the card" },
            },
          },
        },
      },
    },
  };
}

function buildSystemPrompt() {
  return [
    "You are a hunt designer. You take a creative brief plus a list of real-world destinations and produce a fully-themed scavenger hunt configuration.",
    "",
    "Your output drives a kid-friendly PWA: an AI guide character speaks clues aloud, families tap cards to mark finds, and the whole experience needs to feel cohesive — persona, copy, palette, and per-location names should all reinforce the same theme.",
    "",
    "RULES:",
    "- Items: one per destination, in the order provided. Preserve realName exactly as given. Invent a themed `name` and a poetic 1-2 sentence `baseClue` for each.",
    "- Regions: invent 2-4 region names that thematically group the destinations, plus a `default` fallback. Every item's `region` MUST exactly match a key in `scenario.regions`.",
    "- Persona systemPrompt: write a complete in-character system prompt for the AI guide. It MUST include OUTPUT RULES forbidding stage directions (no *sighs*, no (weary smile)), emoji, markdown, or asides — text is read aloud by TTS. Cap the guide at 2-3 short sentences, simple words a child can understand.",
    "- Palette: pick a cohesive hex color scheme. All required tokens must be present and dark-on-light readable.",
    "- Copy: rewrite every UI string in-theme. Preserve placeholders like {count}, {name}, {time}, {names}, {total}.",
    "- Pick the fontPreset and voicePreset whose label best fits the brief.",
    "",
    "Return your output by calling the submit_hunt_theme tool. Do not write anything outside the tool call.",
  ].join("\n");
}

function buildUserPrompt({ userPrompt, destinations, instructions }) {
  const lines = ["CREATIVE BRIEF:", userPrompt, ""];

  if (instructions?.trim()) {
    lines.push("ADDITIONAL INSTRUCTIONS:", instructions.trim(), "");
  }

  lines.push("DESTINATIONS (one item per line):");
  destinations.forEach((d, i) => {
    const parts = [`${i + 1}. ${d.realName}`];
    if (d.region) parts.push(`(suggested region: ${d.region})`);
    if (d.hint) parts.push(`— hint: ${d.hint}`);
    lines.push(parts.join(" "));
  });
  lines.push("");

  lines.push("FONT PRESETS available:");
  for (const [key, preset] of Object.entries(FONT_PRESETS)) {
    lines.push(`- ${key}: ${preset.label}`);
  }
  lines.push("");

  lines.push("VOICE PRESETS available:");
  for (const [key, preset] of Object.entries(VOICE_PRESETS)) {
    lines.push(`- ${key}: ${preset.label}`);
  }

  return lines.join("\n");
}

async function callClaude({ system, user, tool }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      temperature: 0.9,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c) => c.type === "tool_use" && c.name === tool.name);
  if (!toolUse) {
    throw new Error("Claude did not call submit_hunt_theme tool");
  }
  return toolUse.input;
}

// Validates structural rules the JSON schema can't enforce on its own:
// region cross-references, hex format, item id uniqueness, preset keys.
function validateThemeInput(input, expectedItemCount) {
  const errors = [];

  if (!FONT_PRESETS[input.fontPreset]) {
    errors.push(`Unknown fontPreset "${input.fontPreset}"`);
  }
  if (!VOICE_PRESETS[input.voicePreset]) {
    errors.push(`Unknown voicePreset "${input.voicePreset}"`);
  }

  const regionKeys = Object.keys(input.scenario?.regions || {});
  if (!regionKeys.includes("default")) {
    errors.push("scenario.regions must include a 'default' key");
  }

  for (const token of REQUIRED_PALETTE_TOKENS) {
    const v = input.style?.palette?.[token];
    if (!v) errors.push(`palette.${token} missing`);
    else if (!/^#[0-9a-fA-F]{3,8}$/.test(v)) errors.push(`palette.${token} = "${v}" is not a valid hex color`);
  }

  if (!Array.isArray(input.items) || input.items.length !== expectedItemCount) {
    errors.push(`items.length = ${input.items?.length} but expected ${expectedItemCount}`);
  } else {
    const seenIds = new Set();
    for (const item of input.items) {
      if (seenIds.has(item.id)) errors.push(`Duplicate item id "${item.id}"`);
      seenIds.add(item.id);
      if (!regionKeys.includes(item.region)) {
        errors.push(`item "${item.id}" has region "${item.region}" not present in scenario.regions`);
      }
    }
  }

  return errors;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!checkAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { slug, userPrompt, destinations, instructions } = req.body || {};

  if (!isValidSlug(slug)) {
    return res.status(400).json({ error: "slug must match [a-z0-9][a-z0-9-]{0,47}" });
  }
  if (slug === DEFAULT_HUNT_SLUG) {
    return res.status(400).json({ error: `slug "${DEFAULT_HUNT_SLUG}" is reserved for the default hunt` });
  }
  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    return res.status(400).json({ error: "userPrompt required" });
  }
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: "destinations must be a non-empty array" });
  }
  if (destinations.length > 20) {
    return res.status(400).json({ error: "max 20 destinations per hunt" });
  }
  for (const d of destinations) {
    if (!d?.realName || typeof d.realName !== "string") {
      return res.status(400).json({ error: "each destination needs a realName string" });
    }
  }

  const existing = await getTheme(slug);
  if (existing) {
    return res.status(409).json({ error: `Hunt "${slug}" already exists` });
  }

  let themeInput;
  try {
    themeInput = await callClaude({
      system: buildSystemPrompt(),
      user: buildUserPrompt({ userPrompt, destinations, instructions }),
      tool: buildToolSchema(),
    });
  } catch (err) {
    return res.status(502).json({ error: `LLM call failed: ${err.message}` });
  }

  const errors = validateThemeInput(themeInput, destinations.length);
  if (errors.length) {
    return res.status(422).json({
      error: "LLM output failed validation",
      validationErrors: errors,
      generated: themeInput,
    });
  }

  // Persist theme as-returned (with fontPreset/voicePreset keys at top level).
  // lib/theme.js's getTheme() expands fontPreset into style.fontStylesheetUrl
  // + style.fonts on read, so we don't bake those in here.
  await setTheme(slug, themeInput);

  // Seed locations into hunt state so the player UI has cards to render.
  const state = await getState(slug);
  state.locations = themeInput.items;
  await setState(state, slug);

  return res.status(200).json({
    slug,
    previewUrl: `/?hunt=${encodeURIComponent(slug)}`,
    adminUrl: `/admin?hunt=${encodeURIComponent(slug)}`,
    theme: themeInput,
  });
}
