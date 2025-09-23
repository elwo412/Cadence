import { useCallback, useEffect, useRef, useState } from "react";
import { Session } from "../types";

export type TimerMode = "focus" | "break";

export function useTimer(
  workMin: number,
  breakMin: number,
  onSessionComplete: (session: Session) => void
) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(workMin * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => setRunning(true);
  const pauseTimer = () => setRunning(false);
  const stopAndReset = () => {
    setRunning(false);
    setSecs((mode === "focus" ? workMin : breakMin) * 60);
  };

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 100; // ms
    timerRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= (interval / 1000)) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (running) { // Only call onSessionComplete if timer was running
            onSessionComplete({
              at: new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              kind: mode,
              minutes: mode === "focus" ? workMin : breakMin,
              completed: true,
            });
            setRunning(false); // Stop the timer
          }
          const nextMode = mode === "focus" ? "break" : "focus";
          setMode(nextMode);
          return nextMode === "focus" ? workMin * 60 : breakMin * 60;
        }
        return s - (interval / 1000);
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode, workMin, breakMin, onSessionComplete]);

  useEffect(() => {
    if (!running) {
      setSecs((mode === "focus" ? workMin : breakMin) * 60);
    }
  }, [workMin, breakMin, mode, running]);

  const pct = 1 - secs / ((mode === "focus" ? workMin : breakMin) * 60);

  return {
    mode,
    setMode,
    running,
    secs,
    setSecs,
    startTimer,
    pauseTimer,
    stopAndReset,
    pct,
  };
};
