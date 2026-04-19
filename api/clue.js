import { kv } from "@vercel/kv";

const DEFAULT_STATE = { families: [], locations: [], finds: [], ogreCache: {} };

const SYSTEM_PROMPT = `You are Grumblestone, the ancient ogre-caretaker of the Mohawk Trail Kingdom. You are kind-hearted but perpetually tired — centuries of maintaining this land for visiting humans has worn on you. You grumble about small inconveniences (your aching back, the weeds, the tourists who don't wipe their feet) but you genuinely love helping children find wonder in your kingdom.

OUTPUT RULES (very important — your output will be read aloud by a text-to-speech voice):
- Output ONLY the words Grumblestone speaks aloud. Nothing else.
- NEVER write stage directions, action cues, or asterisk annotations like *sighs*, *rubs back*, *leans on walking stick*.
- NEVER write parenthetical asides like (weary smile) or (mumbling to himself).
- NEVER write narrator descriptions of what Grumblestone is doing.
- You can grumble through your words themselves — complain about your back, your knees, the weeds — but express it through dialogue, not by describing the action.
- No emoji. No markdown. No headings. No lists.
- Keep it to 2–3 sentences. Simple words a child can understand. Never break character.`;

function buildUserPrompt(location, mode) {
  if (mode === "clue") {
    return [
      `Give a poetic clue about this place for treasure-hunting children.`,
      `Do NOT name the place directly. Drop enough hints that a curious kid with a grownup can figure it out.`,
      ``,
      `Place: ${location.name} (real name: ${location.realName}, region: ${location.region})`,
      `Existing base clue (for flavor, but write your own in character): "${location.baseClue}"`,
    ].join("\n");
  }
  return [
    `A family of treasure hunters just arrived at this place! Greet them with weary pride.`,
    `Reference something specific and real about the place. Do NOT send them elsewhere — just celebrate this moment.`,
    ``,
    `Place: ${location.name} (real name: ${location.realName}, region: ${location.region})`,
  ].join("\n");
}

async function callClaude(systemPrompt, userPrompt) {
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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.85,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { locationId, mode } = req.body || {};
  if (!locationId || !["clue", "success"].includes(mode)) {
    return res.status(400).json({ error: "locationId and mode ('clue' or 'success') required" });
  }

  const state = (await kv.get("hunt:state")) || DEFAULT_STATE;
  const location = state.locations.find((l) => l.id === locationId);
  if (!location) {
    return res.status(404).json({ error: "Location not found" });
  }

  const cached = state.ogreCache?.[locationId]?.[mode];
  if (cached) {
    return res.status(200).json({ text: cached, cached: true });
  }

  try {
    const text = await callClaude(SYSTEM_PROMPT, buildUserPrompt(location, mode));

    state.ogreCache = state.ogreCache || {};
    state.ogreCache[locationId] = state.ogreCache[locationId] || {};
    state.ogreCache[locationId][mode] = text;
    await kv.set("hunt:state", state);

    return res.status(200).json({ text, cached: false });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
