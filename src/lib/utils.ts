import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Block } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export const uuid = () => crypto.randomUUID();

export const todayISO = () => new Date().toISOString().split('T')[0];

export function overlaps(a: Block, b: Block): boolean {
  if (a.id === b.id) return false;
  const a_start = a.startMin;
  const a_end = a.startMin + a.lengthMin;
  const b_start = b.startMin;
  const b_end = b.startMin + b.lengthMin;
  return a_start < b_end && b_start < a_end;
}
