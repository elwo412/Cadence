export const uuid = () => Math.random().toString(36).slice(2, 10);
export const pad = (n: number) => String(n).padStart(2, "0");
export const todayISO = () => new Date().toISOString().slice(0, 10);
