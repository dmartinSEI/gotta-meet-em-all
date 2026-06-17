import type { ConsultantRow } from "./types";

type Level = 1 | 2 | 3;

export function pickPhoto(c: ConsultantRow): string {
  const lvl = c.catch_level as Level | null;
  if (lvl === 3 && c.photo_url_l3) return c.photo_url_l3;
  if (lvl && lvl >= 2 && c.photo_url_l2) return c.photo_url_l2;
  if (lvl && lvl >= 1 && c.photo_url_l1) return c.photo_url_l1;
  return c.photo_url;
}
