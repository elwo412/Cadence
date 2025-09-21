import React, { useEffect, useRef } from "react";

type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
};

export default function ContextMenu({
  x,
  y,
  onClose,
  children,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1"
      style={{ top: y, left: x }}
    >
      {children}
    </div>
  );
}

export const ContextMenuItem = ({
  onClick,
  children,
  destructive = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-1.5 text-sm ${
        destructive
          ? "text-red-400 hover:bg-red-500/10"
          : "text-zinc-200 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
};
