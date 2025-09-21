// config
export const SLOT_MIN = 30; // snap size
export const NUDGE_MIN = 5; // keyboard/Alt-drag nudge
export const SLOT_HEIGHT = 28; // px per 30m
export const DAY_START = "06:00";
export const DAY_END = "22:00";

// utility helpers
export const parseHHMM = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const minsToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
    Math.round(m % 60)
  ).padStart(2, "0")}`;
export const roundTo = (m: number, step: number) => Math.round(m / step) * step;
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export function roundToSlot(minutes: number) {
  return Math.round(minutes / SLOT_MIN) * SLOT_MIN;
}
