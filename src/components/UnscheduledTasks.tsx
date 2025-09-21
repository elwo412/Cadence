import React, { useMemo } from "react";
import { Task } from "../types";
import Chip from "./Chip";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const UnscheduledTaskChip = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: "TASK",
      task,
    },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab">
      <Chip label={task.title} />
    </div>
  );
};

type UnscheduledTasksProps = {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
};

export default function UnscheduledTasks({
  tasks,
  scheduledTaskIds,
}: UnscheduledTasksProps) {
  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !scheduledTaskIds.has(t.id)),
    [tasks, scheduledTaskIds]
  );

  const { setNodeRef: unscheduledDroppableRef } = useDroppable({
    id: "unscheduled-tray",
  });

  return (
    <div
      ref={unscheduledDroppableRef}
      className="rounded-2xl border border-white/10 bg-white/5 p-3 h-full"
    >
      <div className="text-xs text-zinc-400 mb-2">Unscheduled</div>
      <div className="flex flex-wrap gap-2">
        {unscheduledTasks.map((t) => (
          <UnscheduledTaskChip key={t.id} task={t} />
        ))}
        {unscheduledTasks.length === 0 && (
          <div className="text-xs text-zinc-600">All tasks scheduled.</div>
        )}
      </div>
    </div>
  );
}
