// config
export const SLOT_MIN = 15; // snap size
export const NUDGE_MIN = 5; // keyboard/Alt-drag nudge
export const SLOT_HEIGHT = 28; // px per 30m
export const DAY_START = "00:00";
export const DAY_END = "23:00";

// utility helpers
export const parseHHMM = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const roundTo = (m: number, step: number) => Math.round(m / step) * step;
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export function roundToSlot(minutes: number) {
  return Math.round(minutes / SLOT_MIN) * SLOT_MIN;
}

export function getCurrentTime() {
  const now = new Date();
  return {
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

export function isSameDayISO(a: string, b: string) {
  return a.split('T')[0] === b.split('T')[0];
}

export const minsToHHMM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const minute = Math.round(mins % 60);
  const period = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12; // Handle midnight
  return `${String(hour).padStart(2, " ")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};
