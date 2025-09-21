import { useDraggable } from "@dnd-kit/core";
import React from "react";
import { Task } from "../../types";
import TaskRow from "./TaskRow";

const TaskDraggable = ({
  t,
  children,
}: {
  t: Task;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${t.id}`,
    data: {
      type: "TASK",
      task: t,
    },
  });

  const child = React.Children.only(children);
  if (React.isValidElement(child)) {
    return React.cloneElement(child as React.ReactElement<any>, {
      ref: setNodeRef,
      ...listeners,
      ...attributes,
    });
  }
  return children;
};


type TaskListViewProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
  inQueue: (id: string) => boolean;
  onToggleFocus: (id: string) => void;
};

export default function TaskListView({
  tasks,
  onToggle,
  inQueue,
  onToggleFocus,
}: TaskListViewProps) {
  return (
    <div className="grid gap-2">
      {tasks.map((t) => (
        <TaskDraggable t={t} key={t.id}>
          <TaskRow
            task={t}
            onToggle={onToggle}
            inQueue={inQueue}
            onToggleFocus={onToggleFocus}
          />
        </TaskDraggable>
      ))}
    </div>
  );
}
