import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import { Wand2 } from "lucide-react";
import { Task } from "../types";
import { ParsedTask } from "../types/composer";
import { CompactAdd } from "./CompactAdd";
import { DraggableTaskRow } from "./TaskListView";
import { parseLine } from "../lib/parsing";

type UnscheduledTasksProps = {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
  inQueue: (id: string) => boolean;
  toggleFocusForTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addTask: (task: ParsedTask) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
};

export default function UnscheduledTasks({
  tasks,
  scheduledTaskIds,
  inQueue,
  toggleFocusForTask,
  toggleTask,
  addTask,
  onTaskContextMenu,
}: UnscheduledTasksProps) {
  const { setNodeRef } = useDroppable({ id: "unscheduled-tray" });

  const handleAddTask = (text: string) => {
    const parsed = parseLine(text);
    if (parsed) {
      addTask(parsed);
    }
  };

  return (
    <div ref={setNodeRef} className="h-full flex flex-col">
      <CompactAdd onAdd={handleAddTask} placeholder="Add a task" />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
          // onClick={applyLLM}
        >
          <Wand2 size={14} /> Use AI Assistant
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-auto pr-1">
        <AnimatePresence>
          {tasks
            .filter((t) => !scheduledTaskIds.has(t.id))
            .map((task) => (
              <DraggableTaskRow
                key={task.id}
                task={task}
                inQueue={inQueue}
                onToggleFocus={toggleFocusForTask}
                onToggle={toggleTask}
                onTaskContextMenu={onTaskContextMenu}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
