import React from "react";

const Chip = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
    #{label}
  </span>
);
export default Chip;
