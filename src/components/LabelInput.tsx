import React from "react";

export default function LabelInput({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-zinc-400">
      <span>{label}</span>
      <input
        type="number"
        className="rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-sm text-white"
        value={value}
        onChange={(e) =>
          setValue(Math.max(1, Number(e.target.value || 0)))
        }
      />
    </label>
  );
}
