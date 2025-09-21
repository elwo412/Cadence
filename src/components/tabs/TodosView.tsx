import React from "react";
import { Task } from "../../types";
import TaskListView from "../TaskListView";
import { CompactAdd } from "../CompactAdd";
import { ParsedTask, parseLines } from "../../lib/parsing";

export default function TodosView({
  tasks,
  newTask,
  setNewTask,
  addTask,
  toggleTask,
  inQueue,
  toggleFocusForTask,
  onOpenComposer,
  onTaskContextMenu,
}: {
  tasks: Task[];
  newTask: string;
  setNewTask: (s: string) => void;
  addTask: (tasks: ParsedTask[]) => void;
  toggleTask: (id: string) => void;
  inQueue: (id: string) => boolean;
  toggleFocusForTask: (id: string) => void;
  onOpenComposer: () => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
}) {
  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_0_110px_rgba(110,168,255,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-zinc-200 font-medium">Today’s Todos</div>
        </div>
        <CompactAdd
          value={newTask}
          setValue={setNewTask}
          onAdd={(parsed) => {
            addTask(parsed);
            setNewTask("");
          }}
          onOpenComposer={onOpenComposer}
          parsed={parseLines(newTask)}
        />
        <div className="text-xs text-zinc-500 mt-2 px-3">
          Tokens: <code>#tag</code> <code>~25m</code> <code>!p1</code> •{" "}
          <code>/</code> opens AI
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 overflow-hidden">
        <div className="max-h-[56vh] overflow-auto pr-1">
          <TaskListView
            tasks={tasks}
            onToggle={toggleTask}
            inQueue={inQueue}
            onToggleFocus={toggleFocusForTask}
            onTaskContextMenu={onTaskContextMenu}
          />
        </div>
      </div>
    </>
  );
}
