import { useEffect, useState } from "react";
import usePlannerStore from "./hooks/usePlannerStore";
import { LeftNav } from "./components/nav/LeftNav";
import HomeDashboard from "./pages/HomeDashboard";
import { todayISO } from "./lib/utils";
import CalendarPage from "./pages/CalendarPage";
import TasksPage from "./pages/TasksPage";
import NotesPage from "./pages/NotesPage";
import FocusPage from "./pages/FocusPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import { useHotkeys } from "react-hotkeys-hook";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { TaskCard } from "./components/TaskCard";
import { DRAG_DATA_KEY, DragData, yToSlot } from "./lib/timeGrid";
import { DayBlock, Task } from "./types";
import { v4 as uuidv4 } from "uuid";
import { SLOT_MIN } from "./lib/time";
import { DayPeek } from "./components/calendar/DayPeek";

export type View =
  | "home"
  | "calendar"
  | "tasks"
  | "notes"
  | "focus"
  | "insights"
  | "settings";

export default function AppShell() {
  const [activeView, setActiveView] = useState("home");

  const pages: { [key: string]: React.ReactNode } = {
    home: <HomeDashboard />,
    calendar: <CalendarPage />,
    tasks: <TasksPage />,
    notes: <NotesPage />,
    focus: <FocusPage />,
    insights: <InsightsPage />,
    settings: <SettingsPage />,
  };

  useHotkeys("g h", () => setActiveView("home"));
  useHotkeys("g c", () => setActiveView("calendar"));
  useHotkeys("g t", () => setActiveView("tasks"));
  useHotkeys("g n", () => setActiveView("notes"));
  useHotkeys("g f", () => setActiveView("focus"));
  useHotkeys("g i", () => setActiveView("insights"));
  useHotkeys(",", () => setActiveView("settings"));

  const fetchTasks = usePlannerStore(s => s.fetchTasks);
  const fetchBlocks = usePlannerStore(s => s.fetchBlocks);

  useEffect(() => {
    fetchTasks();
    fetchBlocks(todayISO());
  }, [fetchTasks, fetchBlocks]);


  return (
    <DndContext>
      <div className="h-screen w-screen bg-black flex text-sm text-zinc-100 font-sans">
        <LeftNav active={activeView} setActive={setActiveView} />

        <main className="flex-1 bg-zinc-900/80 overflow-auto">
          {pages[activeView]}
        </main>

        <DayPeek />
      </div>
      {/* <DragOverlay> will be moved into HomeDashboard */}
    </DndContext>
  );
}
