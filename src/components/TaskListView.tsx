import React from "react";
import { Task } from "../../types";
import TaskRow from "./TaskRow";
import { useDraggable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";

const DraggableTask = ({
  task,
  onToggle,
  inQueue,
  onToggleFocus,
  onTaskContextMenu,
}: {
  task: Task;
  onToggle: (id: string) => void;
  inQueue: (id: string) => boolean;
  onToggleFocus: (id: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: "TASK",
      task,
    },
  });

  return (
    <TaskRow
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      task={task}
      onToggle={onToggle}
      inQueue={inQueue}
      onToggleFocus={onToggleFocus}
      onContextMenu={(e) => onTaskContextMenu(e, task.id)}
    />
  );
};

export default function TaskListView({
  tasks,
  onToggle,
  inQueue,
  onToggleFocus,
  onTaskContextMenu,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  inQueue: (id: string) => boolean;
  onToggleFocus: (id: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <AnimatePresence>
        {tasks.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DraggableTask
              task={t}
              onToggle={onToggle}
              inQueue={inQueue}
              onToggleFocus={onToggleFocus}
              onTaskContextMenu={onTaskContextMenu}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {tasks.length === 0 && (
        <div className="text-sm text-zinc-500 text-center py-4">
          No tasks yet.
        </div>
      )}
    </div>
  );
}
