import { useState, useEffect } from "react";
import { Session } from "../types";

export type TimerMode = "focus" | "break";

export const useTimer = (
  workMin: number,
  breakMin: number,
  onSessionComplete: (session: Session) => void
) => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(workMin * 60);

  const startTimer = () => setRunning(true);
  const pauseTimer = () => setRunning(false);
  const stopAndReset = () => {
    setRunning(false);
    setSecs((mode === "focus" ? workMin : breakMin) * 60);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => (s > 0.1 ? s - 0.1 : 0)), 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secs === 0 && running) {
      setRunning(false);
      const minutes = mode === "focus" ? workMin : breakMin;
      onSessionComplete({
        at: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        kind: mode,
        minutes,
        completed: true,
      });

      const next = mode === "focus" ? "break" : "focus";
      setMode(next);
      setSecs((next === "focus" ? workMin : breakMin) * 60);
    }
  }, [secs, running, mode, workMin, breakMin, onSessionComplete]);

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
