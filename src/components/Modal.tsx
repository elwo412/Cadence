import React from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[760px] max-w-[92vw] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_10px_60px_rgba(0,0,0,0.5)]">
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
