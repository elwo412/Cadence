import { CheckSquare2, Target } from "lucide-react";
import React from "react";
import { Task } from "../types";
import Chip from "./Chip";

type TaskRowProps = {
  task: Task;
  onToggle: (id: string) => void;
  inQueue: (id: string) => boolean;
  onToggleFocus: (id: string) => void;
};

const TaskRow = React.forwardRef<HTMLDivElement, TaskRowProps>(
  ({ task, onToggle, inQueue, onToggleFocus, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 cursor-grab"
      >
        <button
          onClick={() => onToggle(task.id)}
          className={`h-5 w-5 rounded-md border ${
            task.done
              ? "bg-emerald-400 border-emerald-300"
              : "border-white/20 bg-white/0"
          } flex items-center justify-center`}
        >
          {task.done && <CheckSquare2 size={14} className="text-black" />}
        </button>
        <div
          className={`flex-1 text-sm whitespace-nowrap ${
            task.done ? "line-through text-zinc-500" : "text-zinc-100"
          }`}
        >
          {task.title}
        </div>
        {task.est && (
          <span className="text-[11px] text-zinc-400 border border-white/10 rounded-md px-1.5 py-0.5">
            ~{task.est}m
          </span>
        )}
        <div className="hidden md:flex gap-1">
          {(task.tags || []).slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </div>
        <button
          className={`ml-auto text-[11px] rounded-md px-2 py-1 border ${
            inQueue(task.id)
              ? "bg-emerald-400 text-black border-emerald-300"
              : "bg-white/5 text-zinc-200 border-white/10"
          } flex items-center gap-1`}
          onClick={() => onToggleFocus(task.id)}
          title={inQueue(task.id) ? "Remove from Focus" : "Add to Focus"}
        >
          <Target size={12} /> {inQueue(task.id) ? "Focusing" : "Focus"}
        </button>
      </div>
    );
  }
);

export default TaskRow;
