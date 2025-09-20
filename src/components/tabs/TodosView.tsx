import {
  CheckSquare2,
  Plus,
  Target,
  Wand2,
} from "lucide-react";
import { Task } from "../../types";
import Chip from "../Chip";

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
        <div className="grid gap-2 max-h-[56vh] overflow-auto pr-1">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={`h-5 w-5 rounded-md border ${
                  t.done
                    ? "bg-emerald-400 border-emerald-300"
                    : "border-white/20 bg-white/0"
                } flex items-center justify-center`}
              >
                {t.done && <CheckSquare2 size={14} className="text-black" />}
              </button>
              <div
                className={`flex-1 text-sm ${
                  t.done ? "line-through text-zinc-500" : "text-zinc-100"
                }`}
              >
                {t.title}
              </div>
              {t.est && (
                <span className="text-[11px] text-zinc-400 border border-white/10 rounded-md px-1.5 py-0.5">
                  ~{t.est}m
                </span>
              )}
              <div className="hidden md:flex gap-1">
                {(t.tags || []).slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </div>
              <button
                className={`ml-auto text-[11px] rounded-md px-2 py-1 border ${
                  inQueue(t.id)
                    ? "bg-emerald-400 text-black border-emerald-300"
                    : "bg-white/5 text-zinc-200 border-white/10"
                } flex items-center gap-1`}
                onClick={() => toggleFocusForTask(t.id)}
                title={inQueue(t.id) ? "Remove from Focus" : "Add to Focus"}
              >
                <Target size={12} /> {inQueue(t.id) ? "Focusing" : "Focus"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
