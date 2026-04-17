import { kv } from "@vercel/kv";

const DEFAULT_STATE = { families: [], locations: [], finds: [], ogreCache: {} };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const state = (await kv.get("hunt:state")) || DEFAULT_STATE;
  return res.status(200).json(state);
}
