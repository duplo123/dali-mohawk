import { kv } from "@vercel/kv";

const KV_KEY = "hunt:state";

export const DEFAULT_STATE = {
  families: [],
  locations: [],
  finds: [],
  guideCache: {},
};

// Reads hunt state from KV and normalizes legacy shapes.
// Legacy: `ogreCache` → `guideCache` (renamed when the "ogre" persona was
// generalized into a configurable guide). Safe to remove this migration
// once all deployments have been touched by at least one write.
export async function getState() {
  const raw = (await kv.get(KV_KEY)) || {};
  const state = { ...DEFAULT_STATE, ...raw };
  if (raw.ogreCache && !raw.guideCache) {
    state.guideCache = raw.ogreCache;
  }
  delete state.ogreCache;
  state.guideCache = state.guideCache || {};
  return state;
}

export async function setState(state) {
  // Guarantee we never persist the legacy field.
  delete state.ogreCache;
  await kv.set(KV_KEY, state);
}
