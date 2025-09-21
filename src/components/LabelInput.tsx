// import React from "react";

type LabelInputProps = {
  label: string;
} & React.ComponentProps<"input">;

export default function LabelInput({ label, ...props }: LabelInputProps) {
  return (
    <label className="grid grid-cols-2 items-center text-sm">
      <span className="text-zinc-300">{label}</span>
      <input
        {...props}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20"
      />
    </label>
  );
}
