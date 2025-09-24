import { useMemo } from "react";

type Mode = "focus" | "break";

type FocusRingProps = {
  seconds: number;
  totalSeconds: number;
  mode: Mode;
  size?: number;
  stroke?: number;
};

export function FocusRing({
  seconds,
  totalSeconds,
  mode = "focus",
  size = 260,
  stroke = 14,
}: FocusRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, 1 - seconds / totalSeconds));
  const dash = c * pct;

  const gradId = useMemo(
    () => `grad-${mode}-${size}-${stroke}`,
    [mode, size, stroke]
  );
  const bloomId = useMemo(
    () => `bloom-${mode}-${size}-${stroke}`,
    [mode, size, stroke]
  );

  const stops =
    mode === "focus"
      ? [
          ["0%", "var(--glow-focus-b)"],   // Amber
          ["100%", "var(--glow-focus-a)"], // Red
        ]
      : [
          ["0%", "var(--glow-break-b)"],   // Blue
          ["100%", "var(--glow-break-a)"], // Teal
        ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {stops.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c as string} />
            ))}
          </linearGradient>
          {/* Soft glow filter */}
          <filter id={bloomId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="var(--track-transparent)"
          fill="none"
        />

        {/* Progress */}
        <g filter={`url(#${bloomId})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${gradId})`}
            strokeDasharray={`${dash} ${c}`}
            fill="none"
            style={{ transition: "stroke-dasharray 0.1s linear" }}
          />
        </g>
      </svg>
    </div>
  );
}
