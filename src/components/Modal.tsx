import React from "react";
import { cn } from "../lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "glass relative w-[760px] max-w-[92vw] rounded-2xl p-6",
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold text-white">{title}</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="text-zinc-300 text-sm">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
