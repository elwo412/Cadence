import { useState } from "react";
import { Task } from "../../types";
import { Checkbox } from "../Checkbox";
import { BrainCircuit } from "lucide-react";
import { llmRefine } from "../../lib/llm";
import { RefineSuggestion } from "../../types/composer";
import { ParsedTask } from "../../lib/parsing";

type RefineTabProps = {
  tasks: Task[];
  setSuggestions: (suggestions: RefineSuggestion[]) => void;
};

export default function RefineTab({ tasks, setSuggestions }: RefineTabProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const handleToggle = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRefine = async () => {
    if (selectedTaskIds.length === 0 || pending) return;
    setPending(true);
    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
    try {
      const parsedTasks: ParsedTask[] = selectedTasks.map(t => ({
        title: t.title,
        est: t.est_minutes,
        tags: t.tags || undefined,
        priority: t.priority,
      }));
      const response = await llmRefine(parsedTasks);
      setSuggestions(response.suggestions);
    } catch (e) {
      console.error("Refinement failed:", e);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col h-[350px]">
      <p className="text-sm text-zinc-400 mb-2 px-1">
        Select tasks you'd like the AI to improve or break down.
      </p>
      <div className="flex-1 space-y-2 overflow-auto pr-2 border border-white/10 rounded-lg p-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <Checkbox
              id={`refine-${task.id}`}
              checked={selectedTaskIds.includes(task.id)}
              onCheckedChange={() => handleToggle(task.id)}
            />
            <label
              htmlFor={`refine-${task.id}`}
              className="flex-1 text-sm text-zinc-300 cursor-pointer"
            >
              {task.title}
            </label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleRefine}
          disabled={selectedTaskIds.length === 0 || pending}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <BrainCircuit size={16} /> Refine Selected
        </button>
      </div>
    </div>
  );
}
