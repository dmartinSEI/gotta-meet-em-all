import type { ConsultantRow } from "./types";

type Level = 1 | 2 | 3;

export function pickPhoto(c: ConsultantRow): string {
  const lvl = c.catch_level as Level | null;
  if (lvl === 3 && c.photo_url_l3) return c.photo_url_l3;
  if (lvl && lvl >= 2 && c.photo_url_l2) return c.photo_url_l2;
  if (lvl && lvl >= 1 && c.photo_url_l1) return c.photo_url_l1;
  return c.photo_url;
}

// Returns border + boxShadow CSS for the circular profile photo ring.
// Catch level drives the ring structure; rarityHex drives the color.
// Append 2-digit hex alpha (e.g. "55" = ~33%, "99" = ~60%, "cc" = ~80%) to rarityHex.
export function photoRingStyle(
  catchLevel: number | null,
  rarityHex: string,
): { border: string; boxShadow: string } {
  const c = rarityHex;

  if (!catchLevel) {
    return {
      border:    "2px solid rgba(255,255,255,0.28)",
      boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
    };
  }

  if (catchLevel === 1) {
    // Single solid ring + faint echo ring
    return {
      border:    `3px solid ${c}`,
      boxShadow: `0 0 0 3px rgba(0,0,0,0.55), 0 0 0 5.5px ${c}55, 0 4px 18px rgba(0,0,0,0.55)`,
    };
  }

  if (catchLevel === 2) {
    // Double ring + color glow
    return {
      border:    `4px solid ${c}`,
      boxShadow: `0 0 0 3px rgba(0,0,0,0.55), 0 0 0 6.5px ${c}, 0 8px 22px ${c}88`,
    };
  }

  // Level 3 — triple ring + strong glow
  return {
    border:    `5px solid ${c}`,
    boxShadow: `0 0 0 2.5px rgba(0,0,0,0.55), 0 0 0 6px ${c}, 0 0 0 8px rgba(0,0,0,0.40), 0 0 0 10.5px ${c}77, 0 10px 32px ${c}99`,
  };
}
