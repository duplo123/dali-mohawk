import { kv } from "@vercel/kv";
import { isValidSlug, DEFAULT_HUNT_SLUG } from "../../lib/state.js";

function checkAdmin(req) {
  const key = req.query?.key || req.headers?.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

const THEME_KEY_PATTERN = /^hunt:([a-z0-9][a-z0-9-]{0,47}):theme$/;

// GET  → { hunts: [{ slug, personaName, scenarioTitle, itemCount, familyCount, findCount }] }
// DELETE ?slug=<slug> → wipes theme + state + audio for that slug.
//                       Refuses to delete the default Mohawk hunt.
export default async function handler(req, res) {
  if (!checkAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    return handleList(res);
  }
  if (req.method === "DELETE") {
    return handleDelete(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleList(res) {
  const themeKeys = await kv.keys("hunt:*:theme");
  const slugs = themeKeys
    .map((k) => k.match(THEME_KEY_PATTERN)?.[1])
    .filter(Boolean);

  const hunts = await Promise.all(slugs.map(async (slug) => {
    const [theme, state] = await Promise.all([
      kv.get(`hunt:${slug}:theme`),
      kv.get(`hunt:${slug}:state`),
    ]);
    return {
      slug,
      personaName: theme?.persona?.name || null,
      scenarioTitle: theme?.scenario?.title || null,
      itemCount: theme?.items?.length || 0,
      familyCount: state?.families?.length || 0,
      findCount: state?.finds?.length || 0,
    };
  }));

  hunts.sort((a, b) => a.slug.localeCompare(b.slug));
  return res.status(200).json({ hunts });
}

async function handleDelete(req, res) {
  const slug = req.query?.slug;
  if (!isValidSlug(slug)) {
    return res.status(400).json({ error: "Invalid slug" });
  }
  if (slug === DEFAULT_HUNT_SLUG) {
    return res.status(400).json({ error: `Cannot delete the default "${DEFAULT_HUNT_SLUG}" hunt` });
  }

  const themeKey = `hunt:${slug}:theme`;
  const stateKey = `hunt:${slug}:state`;
  const audioKeys = await kv.keys(`hunt:${slug}:audio:*`);

  const toDelete = [themeKey, stateKey, ...audioKeys];
  if (toDelete.length) await kv.del(...toDelete);

  return res.status(200).json({ deleted: slug, keysRemoved: toDelete.length });
}
