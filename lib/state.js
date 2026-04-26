import { kv } from "@vercel/kv";

export const DEFAULT_HUNT_SLUG = "mohawk";
const LEGACY_KV_KEY = "hunt:state";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

function stateKey(huntSlug) {
  return `hunt:${huntSlug}:state`;
}

// Lowercase letters/digits/hyphens, must start with alphanumeric, max 48 chars.
// Locks down KV key construction so a malicious slug can't reach into other keys.
export function isValidSlug(slug) {
  return typeof slug === "string" && SLUG_PATTERN.test(slug);
}

// Pulls ?hunt=<slug> from a request, defaulting to the Mohawk hunt.
// Returns null if the caller passed something that doesn't match SLUG_PATTERN.
export function huntSlugFromReq(req) {
  const raw = req?.query?.hunt;
  if (!raw) return DEFAULT_HUNT_SLUG;
  return isValidSlug(raw) ? raw : null;
}

export const DEFAULT_STATE = {
  families: [],
  locations: [],
  finds: [],
  guideCache: {},
};

// Reads hunt state from KV and normalizes legacy shapes.
//
// Legacy migrations:
//   - `ogreCache` → `guideCache` (rename when "ogre" persona was generalized).
//   - `hunt:state` → `hunt:mohawk:state` (rename when KV keys became slug-scoped).
// Both migrations are idempotent and triggered lazily on first read.
export async function getState(huntSlug = DEFAULT_HUNT_SLUG) {
  const key = stateKey(huntSlug);
  let raw = await kv.get(key);

  if (!raw && huntSlug === DEFAULT_HUNT_SLUG) {
    const legacy = await kv.get(LEGACY_KV_KEY);
    if (legacy) {
      raw = legacy;
      await kv.set(key, legacy);
    }
  }

  raw = raw || {};
  const state = { ...DEFAULT_STATE, ...raw };
  if (raw.ogreCache && !raw.guideCache) {
    state.guideCache = raw.ogreCache;
  }
  delete state.ogreCache;
  state.guideCache = state.guideCache || {};
  return state;
}

export async function setState(state, huntSlug = DEFAULT_HUNT_SLUG) {
  delete state.ogreCache;
  await kv.set(stateKey(huntSlug), state);
}
