import { kv } from "@vercel/kv";

const DEFAULT_STATE = { families: [], locations: [], finds: [], ogreCache: {} };

const LOCATIONS = [
  {
    id: "loc_marble",
    name: "The Marble Kingdom",
    realName: "Natural Bridge",
    region: "Western Kingdom",
    baseClue: "Where pale stone remembers a forgotten quarry...",
  },
  {
    id: "loc_canvas",
    name: "The Giant's Canvas",
    realName: "MASS MoCA",
    region: "Western Kingdom",
    baseClue: "A giant's gallery, too vast for any frame...",
  },
  {
    id: "loc_bowls",
    name: "The Giant's Soup Bowls",
    realName: "Shelburne Falls Glacial Potholes",
    region: "River Realm",
    baseClue: "The river stirred its cauldron for ten thousand years...",
  },
  {
    id: "loc_garden",
    name: "The Floating Garden",
    realName: "Bridge of Flowers",
    region: "River Realm",
    baseClue: "A bridge that forgot it was a bridge, and became a garden...",
  },
  {
    id: "loc_sunrise",
    name: "Guardian of the Sunrise",
    realName: "Hail to the Sunrise",
    region: "River Realm",
    baseClue: "He has watched the eastern sky since before your grandparents' grandparents...",
  },
  {
    id: "loc_tower",
    name: "The Medieval Watchtower",
    realName: "Poet's Seat Tower",
    region: "Eastern Outposts",
    baseClue: "Climb the tower where poets once whispered to the valley below...",
  },
  {
    id: "loc_train",
    name: "The Lost Train",
    realName: "Energy Park",
    region: "Eastern Outposts",
    baseClue: "Iron horses sleep here now, dreaming of the rails they once rode...",
  },
  {
    id: "loc_mill",
    name: "The Watermill of Words",
    realName: "Montague Bookmill",
    region: "Eastern Outposts",
    baseClue: "A mill that once ground wheat now grinds stories instead...",
  },
];

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

  const state = (await kv.get("hunt:state")) || DEFAULT_STATE;

  if (state.locations.length > 0) {
    return res.status(200).json({ message: "Already seeded", state });
  }

  state.locations = LOCATIONS;
  await kv.set("hunt:state", state);
  return res.status(200).json({ message: "Seeded 8 locations", state });
}
