import { kv } from "@vercel/kv";
import { getState, setState, huntSlugFromReq } from "../../lib/state.js";

function checkAdmin(req) {
  const key = req.query?.key || req.headers?.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!checkAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const huntSlug = huntSlugFromReq(req);
  if (!huntSlug) return res.status(400).json({ error: "Invalid hunt slug" });

  const audioGlob = `hunt:${huntSlug}:audio:*`;
  const { scope, familyId } = req.body || {};
  const state = await getState(huntSlug);

  if (scope === "family") {
    if (!familyId) {
      return res.status(400).json({ error: "familyId required for family reset" });
    }
    state.finds = state.finds.filter((f) => f.familyId !== familyId);
    await setState(state, huntSlug);
    return res.status(200).json({ message: "Family finds reset", state });
  }

  if (scope === "all") {
    state.finds = [];
    state.families = [];
    state.guideCache = {};
    state.audioVersion = (state.audioVersion || 0) + 1;
    await setState(state, huntSlug);
    const audioKeys = await kv.keys(audioGlob);
    if (audioKeys.length) await kv.del(...audioKeys);
    return res.status(200).json({ message: "Everything reset (locations kept)", state });
  }

  // Legacy "ogre" scope kept as alias for "guide" during rename rollout.
  if (scope === "guide" || scope === "ogre") {
    state.guideCache = {};
    state.audioVersion = (state.audioVersion || 0) + 1;
    await setState(state, huntSlug);
    const audioKeys = await kv.keys(audioGlob);
    if (audioKeys.length) await kv.del(...audioKeys);
    return res.status(200).json({ message: "Guide cache flushed", state });
  }

  return res.status(400).json({ error: 'scope must be "family", "guide", or "all"' });
}
