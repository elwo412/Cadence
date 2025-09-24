import { Calendar, Target } from "lucide-react";
import React from "react";
import { Task } from "../types";
import { Chip } from "./Chip";
import { Checkbox } from "./Checkbox";
import { useDraggable } from "@dnd-kit/core";
import { DatePicker } from "./DatePicker";
import { format, parseISO } from "date-fns";
import usePlanner from "../state/planner";
import { TaskOrigin } from "@/features/tasks/selectors";

type TaskRowProps = {
  task: Task;
  onToggle?: (id: string) => void;
  inQueue?: (id: string) => boolean;
  onToggleFocus?: (id: string) => void;
  interactive?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  origins?: TaskOrigin[];
};

const TaskRow = React.forwardRef<HTMLDivElement, TaskRowProps>(
  (
    {
      task,
      onToggle,
      inQueue,
      onToggleFocus,
      interactive = true,
      onContextMenu,
      origins,
      ...props
    },
    ref
  ) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: `task-${task.id}`,
      data: {
        type: 'TASK',
        taskId: task.id,
        task,
      },
    });

    const setRefs = (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      setNodeRef(node);
    };

    const { updateTask } = usePlanner();

    const handleDueDateChange = (date: Date | null) => {
      updateTask(task.id, { due: date ? format(date, "yyyy-MM-dd") : null });
    };

    return (
      <div
        ref={setRefs}
        onContextMenu={onContextMenu}
        {...props}
        {...attributes}
        {...listeners}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 cursor-grab"
      >
        {interactive && (
          <Checkbox
            id={task.id}
            checked={task.done}
            onCheckedChange={() => onToggle?.(task.id)}
          />
        )}
        <div
          className={`flex-1 text-sm whitespace-nowrap ${
            task.done ? "line-through text-zinc-500" : "text-zinc-100"
          }`}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-1">
          {origins?.map((origin) => (
            <Chip key={origin} label={origin} />
          ))}
        </div>
        {task.est_minutes > 0 && (
          <span className="text-[11px] text-zinc-400 border border-white/10 rounded-md px-1.5 py-0.5">
            ~{task.est_minutes}m
          </span>
        )}
        <DatePicker
          value={task.due ? parseISO(task.due) : null}
          onChange={handleDueDateChange}
        >
          <button className="flex items-center gap-1.5 text-xs text-zinc-400 border border-transparent rounded-md px-1.5 py-0.5 hover:border-white/10">
            <Calendar size={14} />
            {task.due ? format(parseISO(task.due), "MMM d") : "Set due"}
          </button>
        </DatePicker>
        <div className="hidden md:flex gap-1">
          {(task.tags || []).slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </div>
        {interactive && (
          <button
            className={`ml-auto text-[11px] rounded-md px-2 py-1 border ${
              inQueue?.(task.id)
                ? "bg-emerald-400 text-black border-emerald-300"
                : "bg-white/5 text-zinc-200 border-white/10"
            } flex items-center gap-1`}
            onClick={() => onToggleFocus?.(task.id)}
            title={inQueue?.(task.id) ? "Remove from Focus" : "Add to Focus"}
          >
            <Target size={12} /> {inQueue?.(task.id) ? "Focusing" : "Focus"}
          </button>
        )}
      </div>
    );
  }
);

export default TaskRow;
