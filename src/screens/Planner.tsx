import React, { useEffect, useMemo, useState } from "react";
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  CheckSquare2,
  Plus,
  Wand2,
  FileDown,
  Settings,
  Check,
} from "lucide-react";
import { Session, Task } from "../types";
import { pad, todayISO, uuid } from "../lib/utils";
import Ring from "../components/Ring";
import Modal from "../components/Modal";
import Chip from "../components/Chip";
import LabelInput from "../components/LabelInput";

export default function Planner() {
  // Theme → dark glass + subtle red/green glows
  // Timer state
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [secs, setSecs] = useState(workMin * 60);

  // Todos
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: uuid(),
      title: "Write daily plan",
      est: 10,
      tags: ["ritual"],
      done: false,
    },
    {
      id: uuid(),
      title: "Deep work block",
      est: 50,
      tags: ["focus", "pomodoro"],
      done: false,
    },
  ]);
  const [newTask, setNewTask] = useState("");

  // Sessions
  const [log, setLog] = useState<Session[]>([]);

  // Modals
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Subtle LLM suggestion pane (simulated)
  const [suggestion, setSuggestion] = useState<string>(
    "Click the wand to tighten titles + add durations."
  );

  // Timer engine
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (secs === 0 && running) {
      setRunning(false);
      const minutes = mode === "focus" ? workMin : breakMin;
      setLog((l) => [
        {
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          kind: mode,
          minutes,
          completed: true,
        },
        ...l,
      ]);
      // Auto-switch
      const next = mode === "focus" ? "break" : "focus";
      setMode(next);
      setSecs((next === "focus" ? workMin : breakMin) * 60);
    }
  }, [secs, running, mode, workMin, breakMin]);

  // Reset on duration change
  useEffect(() => {
    if (!running) setSecs((mode === "focus" ? workMin : breakMin) * 60);
  }, [workMin, breakMin, mode, running]);

  const pct = 1 - secs / ((mode === "focus" ? workMin : breakMin) * 60);
  const mm = pad(Math.floor(secs / 60));
  const ss = pad(secs % 60);

  // Task ops
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((t) => [
      { id: uuid(), title: newTask.trim(), tags: [], done: false },
      ...t,
    ]);
    setNewTask("");
  };
  const toggleTask = (id: string) =>
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const applyLLM = async () => {
    // Simulate an LLM assist that adds durations & tags, and rephrases titles slightly
    setSuggestion("…thinking");
    await new Promise((r) => setTimeout(r, 750));
    setTasks((ts) =>
      ts.map((t) => ({
        ...t,
        title: t.title.replace(/\b(Write|Do|Work on)\b/i, "Plan"),
        est: t.est ?? (t.title.toLowerCase().includes("deep") ? 50 : 25),
        tags: Array.from(
          new Set([
            ...(t.tags || []),
            ...(t.title.toLowerCase().includes("deep")
              ? ["deepwork"]
              : ["ritual"]),
          ])
        ),
      }))
    );
    setSuggestion(
      "Tidied task titles, added estimates and tags (deepwork/ritual)."
    );
  };

  const markdown = useMemo(() => {
    const lines: string[] = [];
    lines.push("---");
    lines.push(`date: ${todayISO()}`);
    lines.push(`planner: daily-ritual`);
    lines.push("---\n");
    lines.push("# Daily Ritual\n");
    lines.push(
      "> Focus first. Breathe for 10 seconds. Then start the first timer.\n"
    );
    lines.push("## Tasks\n");
    tasks.forEach((t) => {
      const tagStr = (t.tags || []).map((x) => `#${x}`).join(" ");
      lines.push(
        `- [${t.done ? "x" : " "}] ${t.title} ${
          t.est ? `(~${t.est}m)` : ""
        } ${tagStr}`.trim()
      );
    });
    lines.push("\n## Pomodoro Log\n");
    log.forEach((s) =>
      lines.push(`- ${s.at} — ${s.kind} ${s.minutes}m ${s.completed ? "✅" : "⏸️"}`)
    );
    return lines.join("\n");
  }, [tasks, log]);

  return (
    <div
      className="h-screen w-screen text-white"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, #231f2d 0%, #0b0d12 40%, #080a10 100%)",
      }}
    >
      <div className="h-full w-full px-6 py-5 flex gap-6">
        {/* Left: Timer Card */}
        <div className="flex-[0.9] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 relative shadow-[0_0_110px_rgba(255,110,110,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-zinc-300 text-sm">Daily Planner</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={16} /> Settings
              </button>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                onClick={() => setShowExport(true)}
              >
                <FileDown size={16} /> Export
              </button>
            </div>
          </div>

          {/* Timer */}
          <div className="mx-auto relative w-fit">
            <div
              className="absolute -inset-6 rounded-full blur-2xl opacity-40"
              style={{
                background:
                  mode === "focus"
                    ? "radial-gradient(60% 60% at 50% 50%, rgba(255,110,110,.25), transparent)"
                    : "radial-gradient(60% 60% at 50% 50%, rgba(93,211,158,.25), transparent)",
              }}
            ></div>
            <Ring progress={pct} theme={mode} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-semibold tracking-tight">
                {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-zinc-400">
                {mode === "focus" ? "FOCUS" : "BREAK"}
              </div>
              <div className="mt-4 flex items-center gap-2">
                {!running ? (
                  <button
                    className="rounded-xl bg-white text-black px-4 py-2 flex items-center gap-2 shadow"
                    onClick={() => setRunning(true)}
                  >
                    <Play size={16} /> Start
                  </button>
                ) : (
                  <button
                    className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 flex items-center gap-2"
                    onClick={() => setRunning(false)}
                  >
                    <Pause size={16} /> Pause
                  </button>
                )}
                <button
                  className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 flex items-center gap-2"
                  onClick={() => {
                    setRunning(false);
                    setSecs((mode === "focus" ? workMin : breakMin) * 60);
                  }}
                >
                  <StopCircle size={16} /> Reset
                </button>
              </div>
              <div className="mt-3 text-xs text-zinc-400">
                Long break every 4 sessions
              </div>
            </div>
          </div>

          {/* Log */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-zinc-200 font-medium">
                Today’s Sessions
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <Clock size={14} />{" "}
                {log.filter((l) => l.kind === "focus").length} focus •{" "}
                {log.filter((l) => l.kind === "break").length} breaks
              </div>
            </div>
            {log.length === 0 ? (
              <div className="text-sm text-zinc-400 mt-3">
                No sessions yet. Start your first 25:00.
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
                        s.kind === "focus" ? "bg-red-400" : "bg-emerald-400"
                      }`}
                    />
                    <div className="text-sm text-zinc-200 capitalize">
                      {s.kind}
                    </div>
                    <div className="text-xs text-zinc-400">{s.minutes}m</div>
                    <div className="ml-auto text-xs text-zinc-400">
                      {s.at}
                    </div>
                    {s.completed && (
                      <Check className="text-emerald-400" size={14} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Todo + LLM assist */}
        <div className="flex-[1.1] grid grid-rows-[auto_1fr_auto] gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_0_110px_rgba(110,168,255,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-zinc-200 font-medium">Today’s Todos</div>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
                onClick={applyLLM}
              >
                <Wand2 size={16} /> Refine
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task…"
                className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
              />
              <button
                onClick={addTask}
                className="rounded-xl bg-white text-black px-3 py-2 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 overflow-hidden">
            <div className="grid gap-2 max-h-[56vh] overflow-auto pr-1">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <button
                    onClick={() => toggleTask(t.id)}
                    className={`h-5 w-5 rounded-md border ${
                      t.done
                        ? "bg-emerald-400 border-emerald-300"
                        : "border-white/20 bg-white/0"
                    } flex items-center justify-center`}
                  >
                    {t.done && <CheckSquare2 size={14} className="text-black" />}
                  </button>
                  <div
                    className={`flex-1 text-sm ${
                      t.done ? "line-through text-zinc-500" : "text-zinc-100"
                    }`}
                  >
                    {t.title}
                  </div>
                  {t.est && (
                    <span className="text-[11px] text-zinc-400 border border-white/10 rounded-md px-1.5 py-0.5">
                      ~{t.est}m
                    </span>
                  )}
                  <div className="hidden md:flex gap-1">
                    {(t.tags || []).slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-xs text-zinc-400 flex items-center justify-between">
            <div>{suggestion}</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" /> Ready
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Focus Settings"
      >
        <div className="grid grid-cols-2 gap-3">
          <LabelInput
            label="Focus minutes"
            value={workMin}
            setValue={setWorkMin}
          />
          <LabelInput
            label="Break minutes"
            value={breakMin}
            setValue={setBreakMin}
          />
          <div className="col-span-2 flex items-center gap-2 mt-2">
            <button
              className={`rounded-md px-3 py-1.5 text-sm border ${
                mode === "focus"
                  ? "bg-white text-black"
                  : "bg-white/5 text-zinc-200 border-white/10"
              }`}
              onClick={() => {
                setMode("focus");
                setSecs(workMin * 60);
              }}
            >
              Focus
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-sm border ${
                mode === "break"
                  ? "bg-white text-black"
                  : "bg-white/5 text-zinc-200 border-white/10"
              }`}
              onClick={() => {
                setMode("break");
                setSecs(breakMin * 60);
              }}
            >
              Break
            </button>
          </div>
        </div>
        <div slot="footer" />
      </Modal>

      {/* Export */}
      <Modal
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Export Markdown (Obsidian)"
      >
        <div className="grid gap-3">
          <pre className="bg-black/40 border border-white/10 rounded-xl p-3 text-[12px] leading-5 text-zinc-300 max-h-[320px] overflow-auto">
            {markdown}
          </pre>
          <div className="text-xs text-zinc-400">
            File path suggestion: <code>Daily/{todayISO()}.md</code>
          </div>
        </div>
        <div slot="footer" />
      </Modal>
    </div>
  );
}
