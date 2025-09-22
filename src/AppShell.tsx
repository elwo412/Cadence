import { useEffect, useState } from "react";
import { usePlannerStore } from "./hooks/usePlannerStore";
import { LeftNav } from "./components/nav/LeftNav";
import HomePage from "./pages/HomePage";
import { todayISO } from "./lib/utils";
import CalendarPage from "./pages/CalendarPage";
import TasksPage from "./pages/TasksPage";
import NotesPage from "./pages/NotesPage";
import FocusPage from "./pages/FocusPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import { useHotkeys } from "react-hotkeys-hook";
import { MiniDayRail } from "./components/calendar/MiniDayRail";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { useMemo } from "react";
import TaskRow from "./components/TaskRow";
import { DRAG_DATA_KEY, DragData, yToSlot } from "./lib/timeGrid";
import { DayBlock, Task } from "./types";
import { v4 as uuidv4 } from "uuid";
import { SLOT_MIN } from "./lib/time";
import { DayPeek } from "./components/calendar/DayPeek";
import { Header } from "./components/nav/Header";

export type View =
  | "home"
  | "calendar"
  | "tasks"
  | "notes"
  | "focus"
  | "insights"
  | "settings";

export default function AppShell() {
  const [activeView, setActiveView] = useState<View>("home");
  const fetchTasks = usePlannerStore((s) => s.fetchTasks);
  const fetchBlocks = usePlannerStore((s) => s.fetchBlocks);
  const addBlock = usePlannerStore((s) => s.addBlock);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  useHotkeys("g h", () => setActiveView("home"));
  useHotkeys("g c", () => setActiveView("calendar"));
  useHotkeys("g t", () => setActiveView("tasks"));
  useHotkeys("g n", () => setActiveView("notes"));
  useHotkeys("g f", () => setActiveView("focus"));
  useHotkeys("g i", () => setActiveView("insights"));
  useHotkeys(",", () => setActiveView("settings"));

  useEffect(() => {
    fetchTasks();
    fetchBlocks(todayISO());
  }, [fetchTasks, fetchBlocks]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    if (data?.type === "TASK") {
      setActiveDragTask(data.task ?? null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over, activatorEvent } = event;
    const data = active.data.current as DragData;

    if (data?.type === "TASK" && over?.id === "mini-day-rail") {
      const task = data.task!;
      const y = (activatorEvent as PointerEvent).clientY;
      // This is a simplification; a real implementation would get the rail's ref
      const railTop = 0;
      const slotHeight = 12;
      const startSlot = yToSlot(y, railTop, slotHeight);
      const estSlots = Math.ceil((task.est_minutes || 30) / SLOT_MIN);

      const newBlock: DayBlock = {
        id: uuidv4(),
        task_id: task.id,
        date: todayISO(),
        start_slot: startSlot,
        end_slot: startSlot + estSlots,
      };
      addBlock(newBlock);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="h-screen w-screen text-white flex"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% 0%, #231f2d 0%, #0b0d12 40%, #080a10 100%)",
        }}
      >
        <LeftNav active={activeView} setActive={setActiveView} />
        <div className="flex-1 flex flex-col h-full">
          <Header />
          <main className="flex-1 h-[calc(100%-4rem)]">
            {activeView === "home" && <HomePage />}
            {activeView === "calendar" && <CalendarPage />}
            {activeView === "tasks" && <TasksPage />}
            {activeView === "notes" && <NotesPage />}
            {activeView === "focus" && <FocusPage />}
            {activeView === "insights" && <InsightsPage />}
            {activeView === "settings" && <SettingsPage />}
          </main>
        </div>
        <MiniDayRail />
      </div>
      <DragOverlay>
        {activeDragTask ? <TaskRow task={activeDragTask} /> : null}
      </DragOverlay>
      <DayPeek />
    </DndContext>
  );
}
