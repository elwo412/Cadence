import { useEffect, useState } from "react";
import { DAY_END, DAY_START, parseHHMM, SLOT_MIN } from "../lib/time";

export const NowLine = ({ slotHeight }: { slotHeight: number }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const dayStartMin = parseHHMM(DAY_START);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < dayStartMin || nowMin > parseHHMM(DAY_END)) {
    return null;
  }

  const top = ((nowMin - dayStartMin) / SLOT_MIN) * slotHeight;

  return (
    <div
      className="absolute left-0 right-0 h-px bg-red-400 z-10"
      style={{ top }}
    >
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
    </div>
  );
};
