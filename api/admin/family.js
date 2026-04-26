import { getState, setState, huntSlugFromReq } from "../../lib/state.js";

function checkAdmin(req) {
  const key = req.query?.key || req.headers?.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

function generateId() {
  return "fam_" + Math.random().toString(36).substring(2, 8);
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

  const { action, name, familyId } = req.body || {};
  const state = await getState(huntSlug);

  if (action === "add") {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Family name required" });
    }
    const newFamily = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    state.families.push(newFamily);
    await setState(state, huntSlug);
    return res.status(200).json({ message: "Family added", family: newFamily, state });
  }

  if (action === "remove") {
    if (!familyId) {
      return res.status(400).json({ error: "familyId required" });
    }
    state.families = state.families.filter((f) => f.id !== familyId);
    state.finds = state.finds.filter((f) => f.familyId !== familyId);
    await setState(state, huntSlug);
    return res.status(200).json({ message: "Family removed", state });
  }

  return res.status(400).json({ error: 'action must be "add" or "remove"' });
}
