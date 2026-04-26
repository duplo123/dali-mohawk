import { getState, setState, huntSlugFromReq } from "../lib/state.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const huntSlug = huntSlugFromReq(req);
  if (!huntSlug) return res.status(400).json({ error: "Invalid hunt slug" });

  const { familyId, locationId } = req.body || {};
  if (!familyId || !locationId) {
    return res.status(400).json({ error: "familyId and locationId required" });
  }

  const state = await getState(huntSlug);

  const familyExists = state.families.some((f) => f.id === familyId);
  if (!familyExists) {
    return res.status(404).json({ error: "Family not found" });
  }

  const locationExists = state.locations.some((l) => l.id === locationId);
  if (!locationExists) {
    return res.status(404).json({ error: "Location not found" });
  }

  const alreadyFound = state.finds.some(
    (f) => f.familyId === familyId && f.locationId === locationId
  );
  if (alreadyFound) {
    return res.status(200).json({ message: "Already found", state });
  }

  state.finds.push({
    familyId,
    locationId,
    foundAt: new Date().toISOString(),
  });

  await setState(state, huntSlug);
  return res.status(200).json({ message: "Find recorded", state });
}
