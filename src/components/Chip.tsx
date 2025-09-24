import React from "react";

export function Chip({ label }: { label: string }) {
  return (
    <div className="rounded bg-white/10 text-[10px] text-zinc-300 px-1.5 py-0.5">
      {label}
    </div>
  );
}
