import React, { useMemo } from "react";
import { Task } from "../types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import TaskRow from "./TaskRow";

type UnscheduledTasksProps = {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
};

const DraggableTask = ({ task }: { task: Task }) => {
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
      interactive={false}
    />
  );
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
      <div className="grid gap-2">
        {unscheduledTasks.map((t) => (
          <DraggableTask key={t.id} task={t} />
        ))}
        {unscheduledTasks.length === 0 && (
          <div className="text-xs text-zinc-600">All tasks scheduled.</div>
        )}
      </div>
    </div>
  );
}
