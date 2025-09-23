import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Session } from "../../types";
import { useTimer } from "../../hooks/useTimer";
import usePlannerStore, { useActiveFocus, useFocusQueue, useTasks } from "../../hooks/usePlannerStore";
import { FocusRing } from "../focus/FocusRing";
import { Check, Clock, Pause, Play, Settings, StopCircle } from "lucide-react";
import SettingsModal from "../SettingsModal";

export function LeftColumn() {
  const tasks = useTasks();
  const focusQueue = useFocusQueue();
  const activeFocus = useActiveFocus();
  const toggleFocus = usePlannerStore(s => s.toggleFocus);
  const startFocusSession = usePlannerStore(s => s.startFocusSession);
  const clearFocusQueue = usePlannerStore(s => s.clearFocusQueue);
  const endFocusSession = usePlannerStore(s => s.endFocusSession);

  const [log, setLog] = useState<Session[]>([]);

  // Timer state
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [apiKey, setApiKey] = useState(""); // This will be used later
  const [showSettings, setShowSettings] = useState(false);


  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await invoke<Record<string, string>>("get_settings");
      if (settings.workMin) setWorkMin(Number(settings.workMin));
      if (settings.breakMin) setBreakMin(Number(settings.breakMin));
      if (settings.apiKey) setApiKey(settings.apiKey);
    };
    fetchSettings();
  }, []);

  const onSessionComplete = useCallback((session: Session) => {
    const sessionWithTasks = {
      ...session,
      taskIds: activeFocus.length > 0 ? [...activeFocus] : undefined,
    };
    setLog((l) => [sessionWithTasks, ...l]);
    if (session.kind === "focus") {
      endFocusSession();
    }
  }, [activeFocus, endFocusSession]);

  const {
    mode,
    setMode,
    running,
    secs,
    setSecs,
    startTimer,
    pauseTimer,
    stopAndReset,
    pct,
  } = useTimer(workMin, breakMin, onSessionComplete);

  const handleStartTimer = () => {
    if (!running) {
      startFocusSession();
      startTimer();
    }
  };

  const handleStopAndReset = () => {
    stopAndReset();
    endFocusSession();
  };

  const handleSaveSettings = (
    newWorkMin: number,
    newBreakMin: number,
    newApiKey: string
  ) => {
    setWorkMin(newWorkMin);
    setBreakMin(newBreakMin);
    setApiKey(newApiKey);
    invoke("update_setting", { key: "workMin", value: String(newWorkMin) });
    invoke("update_setting", { key: "breakMin", value: String(newBreakMin) });
    invoke("update_setting", { key: "apiKey", value: newApiKey });
  };


  return (
    <div className="border-r border-white/10 p-6 flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div className="text-zinc-300 text-sm">Focus & Capture</div>
            <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                onClick={() => setShowSettings(true)}
            >
                <Settings size={16} />
            </button>
        </div>

      {/* Timer */}
      <div className="flex flex-col items-center">
        <div className="relative w-fit">
          <div
            className="absolute -inset-6 rounded-full blur-2xl opacity-40"
            style={{
              background:
                mode === "focus"
                  ? "radial-gradient(60% 60% at 50% 50%, rgba(255,110,110,0.35), rgba(255,206,110,0.00))"
                  : "radial-gradient(60% 60% at 50% 50%, rgba(93,211,158,0.35), rgba(110,168,255,0.00))",
              mixBlendMode: "screen",
            }}
          />
          <FocusRing
            seconds={secs}
            totalSeconds={mode === 'focus' ? workMin * 60 : breakMin * 60}
            mode={mode}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-semibold tracking-tight">
              {String(Math.floor(secs / 60)).padStart(2, "0")}:
              {String(Math.floor(secs) % 60).padStart(2, "0")}
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-zinc-400">
              {mode === "focus" ? "FOCUS" : "BREAK"}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {!running ? (
            <button
              className="rounded-xl bg-white text-black px-4 py-2 flex items-center gap-2 shadow"
              onClick={handleStartTimer}
            >
              <Play size={16} /> Start
            </button>
          ) : (
            <button
              className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 flex items-center gap-2"
              onClick={pauseTimer}
            >
              <Pause size={16} /> Pause
            </button>
          )}
          <button
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 flex items-center gap-2"
            onClick={handleStopAndReset}
          >
            <StopCircle size={16} /> Reset
          </button>
        </div>
        
        {running && activeFocus.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 justify-center max-w-sm">
            {activeFocus.map((id) => {
              const tt = tasks.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px]"
                >
                  {tt?.title ?? id}
                  <button
                    className="text-zinc-400 hover:text-white"
                    onClick={() => toggleFocus(id)}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {!running && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs w-full max-w-sm">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Focus Queue</span>
              <div className="flex gap-2">
                <button
                  className="rounded-md px-2 py-1 bg-white/5 border border-white/10"
                  onClick={clearFocusQueue}
                >
                  Clear
                </button>
                <button
                  className="rounded-md px-2 py-1 bg-white text-black"
                  onClick={handleStartTimer}
                >
                  Start Queue
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 min-h-[24px]">
              {focusQueue.length === 0 ? (
                <span className="text-zinc-500 text-[11px] italic">
                  Add tasks via list to focus on them
                </span>
              ) : (
                focusQueue.map((id) => {
                  const tt = tasks.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-0.5"
                    >
                      {tt?.title ?? id}
                      <button
                        className="text-zinc-400 hover:text-white"
                        onClick={() => toggleFocus(id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <div className="text-zinc-200 font-medium">Today’s Sessions</div>
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Clock size={14} />{" "}
            {log.filter((l) => l.kind === "focus").length} focus •{" "}
            {log.filter((l) => l.kind === "break").length} breaks
          </div>
        </div>
        {log.length === 0 ? (
          <div className="text-sm text-zinc-400 mt-3">
            No sessions yet.
          </div>
        ) : (
          <div className="mt-3 grid gap-2 max-h-64 overflow-auto pr-1">
            {log.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    s.kind === "focus"
                      ? "bg-red-400"
                      : "bg-emerald-400"
                  }`}
                />
                <div className="text-sm text-zinc-200 capitalize">{s.kind}</div>
                <div className="text-xs text-zinc-400">{s.minutes}m</div>
                <div className="ml-auto text-xs text-zinc-400">{s.at}</div>
                {s.completed && (
                  <Check className="text-emerald-400" size={14} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <SettingsModal
         open={showSettings}
         onClose={() => setShowSettings(false)}
         workMin={workMin}
         breakMin={breakMin}
         apiKey={apiKey}
         onSave={handleSaveSettings}
         mode={mode}
         setMode={setMode}
         setSecs={setSecs}
       />
    </div>
  );
}
