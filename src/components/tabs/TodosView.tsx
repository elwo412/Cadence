import { Plus, Wand2 } from "lucide-react";
import React from "react";
import { Task } from "../../types";
import TaskListView from "../TaskListView";

export default function TodosView({
  tasks,
  newTask,
  setNewTask,
  addTask,
  toggleTask,
  applyLLM,
  inQueue,
  toggleFocusForTask,
}: {
  tasks: Task[];
  newTask: string;
  setNewTask: (s: string) => void;
  addTask: () => void;
  toggleTask: (id: string) => void;
  applyLLM: () => void;
  inQueue: (id: string) => boolean;
  toggleFocusForTask: (id: string) => void;
}) {
  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_0_110px_rgba(110,168,255,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-zinc-200 font-medium">Today’s Todos</div>
          <button
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2"
            onClick={applyLLM}
          >
            <Wand2 size={16} /> Refine
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
          />
          <button
            onClick={addTask}
            className="rounded-xl bg-white text-black px-3 py-2 text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 overflow-hidden">
        <div className="max-h-[56vh] overflow-auto pr-1">
          <TaskListView
            tasks={tasks}
            onToggle={toggleTask}
            inQueue={inQueue}
            onToggleFocus={toggleFocusForTask}
          />
        </div>
      </div>
    </>
  );
}
