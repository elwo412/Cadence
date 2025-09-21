// timeGrid.ts
export interface GridMetrics {
  el: HTMLElement;
  dayStartMin: number;
  dayEndMin: number;
  totalSlots: number; // (dayEnd - dayStart)/SLOT_MIN
}

/** px-per-slot computed from actual scrollHeight so CSS changes don't break math */
export function slotHeightPx(m: GridMetrics) {
  return m.el.scrollHeight / m.totalSlots;
}

export function yToMinutes(clientY: number, m: GridMetrics) {
  const rect = m.el.getBoundingClientRect();
  const localY = (clientY - rect.top) + m.el.scrollTop;
  const h = slotHeightPx(m);
  const minsFromTop = (localY / h) * 30; // 30 = SLOT_MIN
  return m.dayStartMin + minsFromTop;
}

export const roundTo = (mins: number, step = 30) => Math.round(mins / step) * step;

export function clampStart(startMin: number, lengthMin: number, m: GridMetrics) {
  const lo = m.dayStartMin;
  const hi = m.dayEndMin - Math.max(lengthMin, 30);
  return Math.max(lo, Math.min(hi, startMin));
}

export function minutesToTopPx(mins: number, m: GridMetrics) {
  const h = slotHeightPx(m);
  const slotsFromTop = (mins - m.dayStartMin) / 30;
  return slotsFromTop * h;
}
