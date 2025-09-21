// config
export const SLOT_MIN = 30;
export const SLOT_HEIGHT = 28; // px
export const DAY_START = "06:00";
export const DAY_END = "22:00";

// utility helpers
export const parseHHMM = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const minsToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0"
  )}`;
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
export const roundToSlot = (m: number) => Math.round(m / SLOT_MIN) * SLOT_MIN;
export const nextSlotAfter = (mins: number) => roundToSlot(mins + SLOT_MIN); // convenience
