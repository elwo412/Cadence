import { AnimatePresence, motion } from "framer-motion";
import { Task } from "../types";
import TaskRow from "./TaskRow";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Wand2 } from "lucide-react";

type DraggableTaskRowProps = {
  task: Task;
  inQueue: (id: string) => boolean;
  toggleFocusForTask: (id: string) => void;
  toggleTask: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, taskId: string) => void;
};

const DraggableTaskRow = ({
  task,
  inQueue,
  toggleFocusForTask,
  toggleTask,
  onContextMenu,
}: DraggableTaskRowProps) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: "TASK",
      task,
    },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="mb-1"
    >
      <TaskRow
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        task={task}
        onToggle={toggleTask}
        inQueue={inQueue}
        onToggleFocus={toggleFocusForTask}
        onContextMenu={(e) => onContextMenu?.(e, task.id)}
      />
    </motion.div>
  );
};

type UnscheduledTasksProps = {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
  inQueue: (id: string) => boolean;
  toggleFocusForTask: (id: string) => void;
  toggleTask: (id: string) => void;
  newTask: string;
  setNewTask: (task: string) => void;
  addTask: () => void;
  applyLLM: () => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
};

export default function UnscheduledTasks({
  tasks,
  scheduledTaskIds,
  inQueue,
  toggleFocusForTask,
  toggleTask,
  newTask,
  setNewTask,
  addTask,
  applyLLM,
  onTaskContextMenu,
}: UnscheduledTasksProps) {
  const { setNodeRef } = useDroppable({ id: "unscheduled-tray" });
  return (
    <div ref={setNodeRef} className="h-full flex flex-col">
      <div className="relative">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/80"
        />
        <button
          onClick={addTask}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-xs"
        >
          Add
        </button>
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
          onClick={applyLLM}
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
                toggleFocusForTask={toggleFocusForTask}
                toggleTask={toggleTask}
                onContextMenu={onTaskContextMenu}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
