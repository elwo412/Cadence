// config
export const SLOT_MIN = 5; // snap size
export const NUDGE_MIN = 5; // keyboard/Alt-drag nudge
export const SLOT_HEIGHT = 28; // px per 30m
export const DAY_START = "00:00";
export const DAY_END = "24:00";

// utility helpers
export const parseHHMM = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const minsToHHMM = (m: number) => {
  let hour = Math.floor(m / 60);
  const minute = Math.round(m % 60);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12; // Handle midnight
  return `${String(hour).padStart(2, " ")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};
export const roundTo = (m: number, step: number) => Math.round(m / step) * step;
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export function roundToSlot(minutes: number) {
  return Math.round(minutes / SLOT_MIN) * SLOT_MIN;
}
