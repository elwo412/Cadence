import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  FileDown,
  Settings,
  Check,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { DayBlock, Session, Task } from "../types";
import { pad, todayISO, uuid } from "../lib/utils";
import Ring from "../components/Ring";
import Modal from "../components/Modal";
import LabelInput from "../components/LabelInput";
import TodosView from "../components/tabs/TodosView";
import TodayView from "../components/tabs/TodayView";
import NotesView from "../components/tabs/NotesView";
import { minsToHHMM, NUDGE_MIN, SLOT_MIN } from "../lib/time";
import TaskRow from "../components/TaskRow";
import { AnimatePresence, motion } from "framer-motion";
import { CustomPointerSensor } from "../lib/sensors";
import ContextMenu, { ContextMenuItem } from "../components/ContextMenu";
import UnscheduledTasks from "../components/UnscheduledTasks";
import { useCalendarDnD } from "../hooks/useCalendarDnD";
import { useTasks } from "../hooks/useTasks";
import { useTimer } from "../hooks/useTimer";

export type RightPane = "todos" | "today" | "notes";

function loadBlocksFor(date: string): DayBlock[] | null {
  try {
    return JSON.parse(localStorage.getItem("blocks:" + date) || "null");
  } catch {
    return null;
  }
}
function saveBlocksFor(date: string, b: DayBlock[]) {
  localStorage.setItem("blocks:" + date, JSON.stringify(b));
}

export default function Planner() {
  const gridRef = useRef<HTMLDivElement>(null);
  const { tasks, newTask, setNewTask, addTask, toggleTask, applyLLM } =
    useTasks();
  const [blocks, setBlocks] = useState<DayBlock[]>(
    () => loadBlocksFor(todayISO()) || []
  );
  const [activeFocus, setActiveFocus] = useState<string[]>([]);
  const [log, setLog] = useState<Session[]>([]);

  const onSessionComplete = (session: Session) => {
    const sessionWithTasks = {
      ...session,
      taskIds: activeFocus.length > 0 ? [...activeFocus] : undefined,
    };
    setLog((l) => [sessionWithTasks, ...l]);
    if (session.kind === "focus") {
      setActiveFocus([]);
    }
  };

  const {
    mode,
    setMode,
    running,
    workMin,
    setWorkMin,
    breakMin,
    setBreakMin,
    secs,
    setSecs,
    startTimer,
    pauseTimer,
    stopAndReset,
    pct,
  } = useTimer(25, 5, onSessionComplete);

  const sensors = useSensors(
    useSensor(CustomPointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const {
    newBlock,
    previewBlock,
    activeBlock,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragOver,
  } = useCalendarDnD(gridRef, tasks, blocks, setBlocks);

  const handleDndDragStart = (event: DragStartEvent) => {
    handleDragStart(event);
    const { active } = event;
    const { current } = active.data;
    const type = current?.type;
    if (type === "TASK") {
      setActiveTask(current?.task);
    }
  };

  const handleDndDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event);
    setActiveTask(null);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  };

  const handleDuplicateBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block) {
      const newBlock: DayBlock = {
        ...block,
        id: uuid(),
        startMin: block.startMin + block.lengthMin,
      };
      setBlocks((bs) => [...bs, newBlock]);
    }
  };

  const handleSplitBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block && block.lengthMin >= SLOT_MIN * 2) {
      const newLength = Math.floor(block.lengthMin / 2);
      const newBlock1: DayBlock = { ...block, lengthMin: newLength };
      const newBlock2: DayBlock = {
        ...block,
        id: uuid(),
        startMin: block.startMin + newLength,
        lengthMin: block.lengthMin - newLength,
      };
      setBlocks((bs) => [
        ...bs.filter((b) => b.id !== id),
        newBlock1,
        newBlock2,
      ]);
    }
  };

  const scheduledTaskIds = useMemo(() => {
    return new Set(blocks.map((b) => b.taskId));
  }, [blocks]);

  // Multi-select and keyboard shortcuts
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedBlockIds.length > 0) {
          setBlocks((bs) =>
            bs.filter((b) => !selectedBlockIds.includes(b.id))
          );
          setSelectedBlockIds([]);
        }
      }

      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? SLOT_MIN : NUDGE_MIN;
        setBlocks((bs) =>
          bs.map((b) => {
            if (selectedBlockIds.includes(b.id)) {
              if (e.altKey) {
                // Resize mode
                const newLength =
                  e.key === "ArrowUp"
                    ? b.lengthMin - step
                    : b.lengthMin + step;
                return { ...b, lengthMin: Math.max(SLOT_MIN, newLength) };
              } else {
                // Move mode
                const newStart =
                  e.key === "ArrowUp" || e.key === "ArrowLeft"
                    ? b.startMin - step
                    : b.startMin + step;
                return { ...b, startMin: newStart };
              }
            }
            return b;
          })
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBlockIds]);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    blockId: string;
  } | null>(null);

  // Focus / Queue
  const [focusQueue, setFocusQueue] = useState<string[]>([]);

  // Modals
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Right pane
  const [rightPane, setRightPane] = useState<RightPane>("todos");
  const [notes, setNotes] = useState("");

  // Subtle LLM suggestion pane (simulated)
  const [suggestion, setSuggestion] = useState<string>(
    "Click the wand to tighten titles + add durations."
  );

  // Load notes from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("cadence-notes");
    if (savedNotes) setNotes(savedNotes);
  }, []);

  // Save notes to local storage on change
  useEffect(() => {
    localStorage.setItem("cadence-notes", notes);
  }, [notes]);

  useEffect(() => {
    saveBlocksFor(todayISO(), blocks);
  }, [blocks]);

  // --- Helper Fns ---
  const inQueue = (id: string) =>
    focusQueue.includes(id) || activeFocus.includes(id);

  const toggleFocusForTask = (id: string) => {
    // If running, alter the active session; else alter the queue.
    if (running) {
      setActiveFocus((a) =>
        a.includes(id) ? a.filter((x) => x !== id) : [...a, id]
      );
    } else {
      setFocusQueue((q) =>
        q.includes(id) ? q.filter((x) => x !== id) : [...q, id]
      );
    }
  };

  const clearQueue = () => setFocusQueue([]);

  const handleStartTimer = () => {
    if (!running) {
      setActiveFocus(focusQueue);
      startTimer();
    }
  };

  const handleStopAndReset = () => {
    stopAndReset();
    setActiveFocus([]);
  };

  // Hotkeys for tab switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setRightPane("todos");
      if (e.key === "2") setRightPane("today");
      if (e.key === "3") setRightPane("notes");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    log.forEach((s) => {
      const taskStr = (s.taskIds || [])
        .map((id) => tasks.find((t) => t.id === id)?.title || id)
        .join(", ");
      const tasksNote = taskStr ? ` — tasks: ${taskStr}` : "";
      lines.push(
        `- ${s.at} — ${s.kind} ${s.minutes}m ${
          s.completed ? "✅" : "⏸️"
        }${tasksNote}`
      );
    });

    if (blocks.length > 0) {
      lines.push("\n## Today\n");
      blocks
        .slice() // ensure order by start time
        .sort((a, b) => a.startMin - b.startMin)
        .forEach((b) => {
          const t = tasks.find((x) => x.id === b.taskId);
          lines.push(
            `- ${minsToHHMM(b.startMin)} (${b.lengthMin}m): **${
              t?.title ?? "Untitled"
            }**`
          );
        });
    }

    if (notes.trim()) {
      lines.push("\n## Notes\n");
      lines.push(notes.trim());
    }

    return lines.join("\n");
  }, [tasks, log, blocks, notes]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDndDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDndDragEnd}
      collisionDetection={closestCenter}
    >
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
            <AnimatePresence mode="wait">
              {rightPane === "today" ? (
                <motion.div
                  key="task-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-zinc-300 text-sm">Tasks for Today</div>
                  </div>
                  <div className="h-[calc(100%-32px)] overflow-auto pr-1">
                    <UnscheduledTasks
                      tasks={tasks}
                      scheduledTaskIds={scheduledTaskIds}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="timer-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
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
                  <div className="flex flex-col items-center">
                    <div className="relative w-fit">
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
                          {pad(Math.floor(secs / 60))}:
                          {pad(Math.floor(secs) % 60)}
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
                    <div className="mt-3 text-xs text-zinc-400">
                      Long break every 4 sessions
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
                                onClick={() => toggleFocusForTask(id)}
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
                              onClick={clearQueue}
                            >
                              Clear
                            </button>
                            <button
                              className="rounded-md px-2 py-1 bg-white text-black"
                              onClick={handleStartTimer}
                            >
                              Use Queue Now
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {focusQueue.length === 0 ? (
                            <span className="text-zinc-500">
                              Add tasks via “Focus”
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
                                    onClick={() => toggleFocusForTask(id)}
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
                                s.kind === "focus"
                                  ? "bg-red-400"
                                  : "bg-emerald-400"
                              }`}
                            />
                            <div className="text-sm text-zinc-200 capitalize">
                              {s.kind}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {s.minutes}m
                            </div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Todo + LLM assist */}
          <div className="flex-[1.1] grid grid-rows-[auto_1fr_auto] gap-4">
            <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-black/20 p-1">
              {(["todos", "today", "notes"] as RightPane[]).map((p) => (
                <button
                  key={p}
                  className={`flex-1 rounded-2xl px-3 py-2 text-sm capitalize ${
                    rightPane === p
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5"
                  }`}
                  onClick={() => setRightPane(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="grid gap-4 min-h-0">
              {rightPane === "todos" && (
                <TodosView
                  tasks={tasks}
                  newTask={newTask}
                  setNewTask={setNewTask}
                  addTask={addTask}
                  toggleTask={toggleTask}
                  applyLLM={() => {
                    applyLLM();
                    setSuggestion(
                      "Tidied task titles, added estimates and tags (deepwork/ritual)."
                    );
                  }}
                  inQueue={inQueue}
                  toggleFocusForTask={toggleFocusForTask}
                />
              )}
              {rightPane === "today" && (
                <TodayView
                  ref={gridRef}
                  blocks={blocks}
                  tasks={tasks}
                  newBlock={newBlock}
                  activeBlock={activeBlock}
                  previewBlock={previewBlock}
                  onDeleteBlock={handleDeleteBlock}
                  selectedBlockIds={selectedBlockIds}
                  setSelectedBlockIds={setSelectedBlockIds}
                  onContextMenu={setContextMenu}
                />
              )}
              {rightPane === "notes" && (
                <NotesView notes={notes} setNotes={setNotes} />
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-xs text-zinc-400 flex items-center justify-between">
              <div>{suggestion}</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" /> Ready
              </div>
            </div>
          </div>
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          >
            <ContextMenuItem
              onClick={() => {
                handleDuplicateBlock(contextMenu.blockId);
                setContextMenu(null);
              }}
            >
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                handleSplitBlock(contextMenu.blockId);
                setContextMenu(null);
              }}
            >
              Split
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                handleDeleteBlock(contextMenu.blockId);
                setContextMenu(null);
              }}
              destructive
            >
              Delete
            </ContextMenuItem>
          </ContextMenu>
        )}

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
        <DragOverlay>
          {activeTask ? (
            <div className="w-[550px]">
              <TaskRow
                task={activeTask}
                onToggle={() => {}}
                inQueue={inQueue}
                onToggleFocus={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
