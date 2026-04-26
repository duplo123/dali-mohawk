import { getState, setState, huntSlugFromReq } from "../lib/state.js";
import { getTheme } from "../lib/theme.js";

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

  const theme = await getTheme(huntSlug);
  if (!theme) {
    return res.status(404).json({ error: `No theme found for hunt "${huntSlug}"` });
  }

  const state = await getState(huntSlug);

  if (state.locations.length > 0) {
    return res.status(200).json({ message: "Already seeded", state });
  }

  const items = theme.items || [];
  if (items.length === 0) {
    return res.status(400).json({ error: "No items defined in theme" });
  }

  state.locations = items;
  await setState(state, huntSlug);
  return res.status(200).json({ message: `Seeded ${items.length} locations`, state });
}
