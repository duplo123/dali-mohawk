import { kv } from "@vercel/kv";

const DEFAULT_STATE = { families: [], locations: [], finds: [], ogreCache: {} };

function checkAdmin(req) {
  const key = req.query?.key || req.headers?.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
  if (!checkAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const state = (await kv.get("hunt:state")) || DEFAULT_STATE;
    return res.status(200).json(state);
  }

  if (req.method === "POST") {
    // Toggle a specific find on/off
    const { familyId, locationId, found } = req.body || {};
    if (!familyId || !locationId || typeof found !== "boolean") {
      return res.status(400).json({ error: "familyId, locationId, and found (bool) required" });
    }

    const state = (await kv.get("hunt:state")) || DEFAULT_STATE;

    if (found) {
      const alreadyFound = state.finds.some(
        (f) => f.familyId === familyId && f.locationId === locationId
      );
      if (!alreadyFound) {
        state.finds.push({
          familyId,
          locationId,
          foundAt: new Date().toISOString(),
        });
      }
    } else {
      state.finds = state.finds.filter(
        (f) => !(f.familyId === familyId && f.locationId === locationId)
      );
    }

    await kv.set("hunt:state", state);
    return res.status(200).json(state);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
