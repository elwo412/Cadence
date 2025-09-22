import { SLOT_MIN } from "./time";

// timeGrid.ts
export interface GridMetrics {
    el: HTMLElement;
    dayStartMin: number;
    dayEndMin: number;
    slotHeight: number;
}

export function yToMinutes(clientY: number, m: GridMetrics) {
    const rect = m.el.getBoundingClientRect();
    const localY = clientY - rect.top + m.el.scrollTop;
    const minsFromTop = (localY / m.slotHeight) * SLOT_MIN;
    return m.dayStartMin + minsFromTop;
}

export const roundTo = (mins: number, step = 30) =>
    Math.round(mins / step) * step;

export function clampStart(
    startMin: number,
    lengthMin: number,
    m: GridMetrics
) {
    const lo = m.dayStartMin;
    const hi = m.dayEndMin - Math.max(lengthMin, SLOT_MIN);
    return Math.max(lo, Math.min(hi, startMin));
}

export function minutesToTopPx(mins: number, m: GridMetrics) {
    const slotsFromTop = (mins - m.dayStartMin) / SLOT_MIN;
    return slotsFromTop * m.slotHeight;
}
