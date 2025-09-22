import React from "react";
import { cn } from "../lib/utils";
import { Check } from "lucide-react";

type CheckboxProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
} & Omit<React.ComponentProps<"button">, "onClick">;

export const Checkbox = ({
  id,
  checked,
  onCheckedChange,
  ...props
}: CheckboxProps) => {
  return (
    <button
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0",
        checked
          ? "bg-emerald-400 border-emerald-300"
          : "border-white/20 bg-white/0"
      )}
      {...props}
    >
      {checked && <Check size={14} className="text-black" />}
    </button>
  );
};
