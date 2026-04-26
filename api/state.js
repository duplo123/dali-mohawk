import { getState, huntSlugFromReq } from "../lib/state.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const huntSlug = huntSlugFromReq(req);
  if (!huntSlug) return res.status(400).json({ error: "Invalid hunt slug" });

  const state = await getState(huntSlug);
  return res.status(200).json(state);
}
