import { clientTheme } from "../config/theme.js";

export default function handler(req, res) {
  // Cache briefly so repeat loads are fast; short TTL so creators see edits on redeploy.
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  return res.status(200).json(clientTheme());
}
