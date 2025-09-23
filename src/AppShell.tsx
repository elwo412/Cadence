import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  DndContext,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  closestCenter,
  DragCancelEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { todayISO } from "@/lib/utils";
import { DayPeek } from "@/components/calendar/DayPeek";
import { Task } from "./types";
import { usePlanner } from "./state/planner";
import { LeftNav } from "@/components/nav/LeftNav";
import HomeDashboard from "@/pages/HomeDashboard";
import CalendarPage from "@/pages/CalendarPage";
import TasksPage from "@/pages/TasksPage";
import NotesPage from "@/pages/NotesPage";
import FocusPage from "@/pages/FocusPage";
import InsightsPage from "@/pages/InsightsPage";
import SettingsPage from "@/pages/SettingsPage";

function TaskDragOverlay({ task }: { task: Task }) {
  return (
    <div className="w-64 rounded-xl border border-white/10 bg-black/40 shadow-[0_6px_18px_rgba(0,0,0,0.35)] p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-zinc-200 text-sm">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>~{task.est_minutes}m</span>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [activeView, setActiveView] = useState("home");
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [isOverRail, setIsOverRail] = useState(false);
  const { setPreviewBlock, addBlock, setIsHoveringMiniDayRail } = usePlanner();

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

  const fetchTasks = usePlanner(s => s.fetchTasks);
  const fetchBlocks = usePlanner(s => s.fetchBlocks);

  React.useEffect(() => {
    fetchTasks();
    fetchBlocks(todayISO());
  }, [fetchTasks, fetchBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'TASK') {
      setActiveDragTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    const activeData = active.data.current;

    const isOverSlot = typeof overId === 'string' && overId.startsWith('slot-');
    setIsOverRail(isOverSlot);

    if (isOverSlot && activeData?.type === 'TASK') {
      const startMin = parseInt(overId.split('-')[1]);
      const task = activeData.task as Task;
      if (task) {
        setIsHoveringMiniDayRail(true);
        setPreviewBlock({
          id: 'preview-block',
          dateISO: todayISO(),
          startMin,
          lengthMin: task.est_minutes,
          kind: 'atomic',
          taskId: task.id,
        });
      }
    } else {
      setIsHoveringMiniDayRail(false);
      setPreviewBlock(null);
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    if (previewBlock && isOverRail) {
      const { id, ...newBlock } = previewBlock;
      addBlock(newBlock);
    }
    setPreviewBlock(null);
    setIsHoveringMiniDayRail(false);
    setIsOverRail(false);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveDragTask(null);
    setPreviewBlock(null);
    setIsHoveringMiniDayRail(false);
  };

  const previewBlock = usePlanner((state) => state.previewBlock);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div className="h-screen w-screen bg-black flex text-sm text-zinc-100 font-sans">
        <LeftNav active={activeView} setActive={setActiveView} />

        <main className="flex-1 bg-zinc-900/80 overflow-auto min-h-0">
          {pages[activeView]}
        </main>

        <DayPeek />
      </div>
      <DragOverlay>
        {activeDragTask ? <TaskDragOverlay task={activeDragTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
