import { getState, setState, huntSlugFromReq } from "../lib/state.js";
import { getTheme } from "../lib/theme.js";

function buildUserPrompt(persona, location, mode) {
  const instructions = persona.promptInstructions?.[mode] || [];
  const locationLine = `Place: ${location.name} (real name: ${location.realName}, region: ${location.region})`;
  const lines = [...instructions, "", locationLine];
  if (mode === "clue" && location.baseClue) {
    lines.push(`Existing base clue (for flavor, but write your own in character): "${location.baseClue}"`);
  }
  return lines.join("\n");
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

  const huntSlug = huntSlugFromReq(req);
  if (!huntSlug) return res.status(400).json({ error: "Invalid hunt slug" });

  const { locationId, mode } = req.body || {};
  if (!locationId || !["clue", "success"].includes(mode)) {
    return res.status(400).json({ error: "locationId and mode ('clue' or 'success') required" });
  }

  const theme = await getTheme(huntSlug);
  if (!theme) {
    return res.status(404).json({ error: `No theme found for hunt "${huntSlug}"` });
  }

  const state = await getState(huntSlug);
  const location = state.locations.find((l) => l.id === locationId);
  if (!location) {
    return res.status(404).json({ error: "Location not found" });
  }

  const cached = state.guideCache?.[locationId]?.[mode];
  if (cached) {
    return res.status(200).json({ text: cached, cached: true });
  }

  try {
    const text = await callClaude(theme.persona.systemPrompt, buildUserPrompt(theme.persona, location, mode));

    state.guideCache[locationId] = state.guideCache[locationId] || {};
    state.guideCache[locationId][mode] = text;
    await setState(state, huntSlug);

    return res.status(200).json({ text, cached: false });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
