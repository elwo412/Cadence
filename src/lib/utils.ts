import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DayBlock } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export const uuid = () => crypto.randomUUID();

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function overlaps(a: DayBlock, b: DayBlock): boolean {
  if (a.id === b.id) return false;
  return a.start_slot < b.end_slot && a.end_slot > b.start_slot;
}
