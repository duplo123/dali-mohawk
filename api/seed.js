import { theme } from "../config/theme.js";
import { getState, setState } from "../lib/state.js";

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

  const state = await getState();

  if (state.locations.length > 0) {
    return res.status(200).json({ message: "Already seeded", state });
  }

  const items = theme.items || [];
  if (items.length === 0) {
    return res.status(400).json({ error: "No items defined in config/theme.js" });
  }

  state.locations = items;
  await setState(state);
  return res.status(200).json({ message: `Seeded ${items.length} locations`, state });
}
