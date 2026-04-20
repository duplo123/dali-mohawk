import { kv } from "@vercel/kv";
import { getState } from "../lib/state.js";

function stripNonSpoken(text) {
  return text
    .replace(/\*[^*]*\*/g, "")     // *rubs back* / *sighs*
    .replace(/\([^)]*\)/g, "")     // (weary smile)
    .replace(/\[[^\]]*\]/g, "")    // [aside]
    .replace(/\s+/g, " ")
    .trim();
}

async function callElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID not configured");

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.6,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${errText.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

export default async function handler(req, res) {
  const { locationId, mode, fresh } = req.query || {};
  if (!locationId || !["clue", "success"].includes(mode)) {
    return res.status(400).json({ error: "locationId and mode ('clue' or 'success') required" });
  }

  const audioKey = `hunt:audio:${locationId}:${mode}`;
  const bypassCache = fresh === "1";

  let base64 = bypassCache ? null : await kv.get(audioKey);

  if (!base64) {
    const state = await getState();
    const text = state.guideCache?.[locationId]?.[mode];
    if (!text) {
      return res.status(400).json({ error: "No guide text yet — generate the clue first" });
    }

    try {
      const spoken = stripNonSpoken(text);
      if (!spoken) throw new Error("Nothing to speak after stripping stage directions");
      const buffer = await callElevenLabs(spoken);
      if (!buffer || buffer.length < 1024) {
        throw new Error(`Suspiciously small audio response (${buffer?.length ?? 0} bytes)`);
      }
      base64 = buffer.toString("base64");
      await kv.set(audioKey, base64);
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }

  const buffer = Buffer.from(base64, "base64");
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", bypassCache ? "no-store" : "public, max-age=31536000, immutable");
  return res.status(200).send(buffer);
}
