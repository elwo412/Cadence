import React from "react";

export default function Ring({
  size = 220,
  stroke = 14,
  progress = 0,
  theme,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  theme: "focus" | "break";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * c;
  const id = `g-${theme}`;
  return (
    <svg width={size} height={size} className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {theme === "focus" ? (
            <>
              <stop offset="0%" stopColor="#FF6E6E" />
              <stop offset="100%" stopColor="#FFCE6E" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#5DD39E" />
              <stop offset="100%" stopColor="#6EA8FF" />
            </>
          )}
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke="#101319"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        stroke={`url(#${id})`}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.1s linear" }}
      />
    </svg>
  );
}
