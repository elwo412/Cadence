import React, { useMemo } from "react";

type Mode = "focus" | "break";

export function FocusRing({
  seconds,
  totalSeconds,
  mode = "focus",
  size = 260,
  stroke = 14,
  showTicks = true,
}: {
  seconds: number;
  totalSeconds: number;
  mode?: Mode;
  size?: number;
  stroke?: number;
  showTicks?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, 1 - seconds / totalSeconds));
  const dash = c * pct;

  const ids = useMemo(
    () => ({
      grad: `grad-${mode}-${size}-${stroke}`,
      bloom: `bloom-${mode}-${size}-${stroke}`,
      tick: `tick-${size}`,
    }),
    [mode, size, stroke]
  );

  const stops =
    mode === "focus"
      ? [
          ["0%", "var(--glow-focus-a)"],
          ["100%", "var(--glow-focus-b)"],
        ]
      : [
          ["0%", "var(--glow-break-a)"],
          ["100%", "var(--glow-break-b)"],
        ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient bloom */}
      <div
        className="absolute -inset-10 rounded-full blur-2xl opacity-60 pointer-events-none"
        style={{
          background:
            mode === "focus"
              ? "radial-gradient(60% 60% at 50% 50%, rgba(255,110,110,0.35), rgba(255,206,110,0.00))"
              : "radial-gradient(60% 60% at 50% 50%, rgba(93,211,158,0.35), rgba(110,168,255,0.00))",
          mixBlendMode: "screen",
        }}
      />

      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id={ids.grad} x1="0" y1="0" x2="1" y2="1">
            {stops.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c as string} />
            ))}
          </linearGradient>

          {/* Soft glow filter */}
          <filter id={ids.bloom} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* tick path (5m marks) */}
          <path id={ids.tick} d={`M ${size / 2} ${stroke / 2} v ${stroke / 2}`} />
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="var(--track)"
          fill="none"
        />

        {/* Optional ticks every 5 min */}
        {showTicks && (
          <g
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={2}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <use
                key={i}
                href={`#${ids.tick}`}
                transform={`rotate(${(360 / 12) * i} ${size / 2} ${size / 2})`}
              />
            ))}
          </g>
        )}

        {/* Progress */}
        <g filter={`url(#${ids.bloom})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${ids.grad})`}
            strokeDasharray={`${dash} ${c}`}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </g>
      </svg>

      {/* Start dot */}
      <div
        className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          left: size / 2,
          top: stroke / 2 + 1,
          background:
            mode === "focus" ? "var(--glow-focus-b)" : "var(--glow-break-b)",
          boxShadow:
            "0 0 12px 3px rgba(255,206,110,0.35), 0 0 0 2px rgba(255,255,255,0.06) inset",
        }}
        aria-hidden
      />
    </div>
  );
}
