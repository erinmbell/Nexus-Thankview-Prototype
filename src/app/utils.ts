/**
 * Shared utility functions for the ThankView dashboard.
 */

/** Given a hex color, return a very light tint (90 % toward white) for use as envelope lining / light variant. */
export const hexToLight = (hex: string): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * 0.9);
  const lg = Math.round(g + (255 - g) * 0.9);
  const lb = Math.round(b + (255 - b) * 0.9);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
};

/** Format a duration in seconds as m:ss (e.g. 68 → "1:08"). */
export const fmtSec = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
