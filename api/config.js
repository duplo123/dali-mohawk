import { getClientTheme } from "../lib/theme.js";
import { huntSlugFromReq } from "../lib/state.js";

export default async function handler(req, res) {
  const huntSlug = huntSlugFromReq(req);
  if (!huntSlug) return res.status(400).json({ error: "Invalid hunt slug" });

  const clientTheme = await getClientTheme(huntSlug);
  if (!clientTheme) {
    return res.status(404).json({ error: `No theme found for hunt "${huntSlug}"` });
  }

  // Cache briefly so repeat loads are fast; short TTL so creators see edits on redeploy.
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  return res.status(200).json(clientTheme);
}
