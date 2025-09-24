import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Stars, Wand2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import Modal from "./Modal";
import { ParsedTask } from "../lib/parsing";
import "react-tabs/style/react-tabs.css";
import { QuickAddTab } from "./TaskComposer/QuickAddTab";
import PlanWithAITab from "./TaskComposer/PlanWithAITab";
import RefineTab from "./TaskComposer/RefineTab";
import DraftBasket from "./TaskComposer/DraftBasket";
import { llmEnrich } from "../lib/llm";
import { Task } from "../types";
import { RefineSuggestion } from "../types/composer";

type TaskComposerProps = {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onTaskAdd: (task: ParsedTask) => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
};

type Tab = "quick" | "plan" | "refine";

const TabButton = ({
  active,
  onClick,
  children,
}: React.PropsWithChildren<{ active: boolean; onClick: () => void }>) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 text-sm rounded-md font-medium flex-1",
      active
        ? "bg-white/10 text-white"
        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
    )}
  >
    {children}
  </button>
);

export default function TaskComposer({
  open,
  onClose,
  tasks,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
}: TaskComposerProps) {
  const [tab, setTab] = useState<Tab>("quick");
  const [draftTasks, setDraftTasks] = useState<ParsedTask[]>([]);
  const [suggestions, setSuggestions] = useState<RefineSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCreate = () => {
    // Handle newly planned tasks
    const newTasks = draftTasks.filter((_t, i) =>
      selectedIds.includes(`task-${i}`)
    );
    newTasks.forEach((task) => onTaskAdd(task));

    // Handle refinement suggestions
    const selectedSuggestions = suggestions.filter((_s, i) =>
      selectedIds.includes(`sug-${i}`)
    );
    selectedSuggestions.forEach((sug) => {
      switch (sug.kind) {
        case "update":
          if (sug.updates) {
            sug.targetIds.forEach((id: string) =>
              onTaskUpdate(id, sug.updates as Partial<Task>)
            );
          }
          break;
        case "split":
          if (sug.split) {
            sug.targetIds.forEach((id: string) => onTaskDelete(id));
            sug.split.forEach((task: ParsedTask) => onTaskAdd(task));
          }
          break;
        case "merge":
          // Not implemented yet
          break;
      }
    });

    setDraftTasks([]);
    setSuggestions([]);
    setSelectedIds([]);
    onClose();
  };

  const handleClearBasket = () => {
    setDraftTasks([]);
    setSuggestions([]);
    setSelectedIds([]);
  };

  const handleQuickAdd = async (tasks: ParsedTask[]) => {
    console.log("Enriching:", tasks);
    setDraftTasks(tasks); // Set draft immediately for preview
    try {
      const enriched = await llmEnrich(tasks.map((t) => ({ title: t.title })));
      console.log("Enriched:", enriched);
      // In the future, we'll show a preview of the enriched data.
      // For now, we'll just update the draft with the enriched data.
      setDraftTasks(enriched.tasks);
      setSelectedIds(enriched.tasks.map((_t, i) => `task-${String(i)}`)); // Auto-select all
    } catch (e) {
      console.error("Enrichment failed:", e);
      // Handle error case - maybe a toast notification
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Task Composer">
      <div className="flex flex-col gap-4 max-w-2xl w-[700px] mx-auto">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-black/20 border border-white/10">
          <TabButton active={tab === "quick"} onClick={() => setTab("quick")}>
            <div className="flex items-center justify-center gap-2">
              <Wand2 size={16} /> Quick Add
            </div>
          </TabButton>
          <TabButton active={tab === "plan"} onClick={() => setTab("plan")}>
            <div className="flex items-center justify-center gap-2">
              <Stars size={16} /> Plan with AI
            </div>
          </TabButton>
          <TabButton active={tab === "refine"} onClick={() => setTab("refine")}>
            <div className="flex items-center justify-center gap-2">
              <BrainCircuit size={16} /> AI Refine
            </div>
          </TabButton>
        </div>

        <div className="min-h-[350px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {tab === "quick" && <QuickAddTab onAccept={handleQuickAdd} />}
              {tab !== "quick" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {tab === "plan" && <PlanWithAITab setDrafts={setDraftTasks} />}
                    {tab === "refine" && (
                      <RefineTab tasks={tasks} setSuggestions={setSuggestions} />
                    )}
                  </div>
                  <DraftBasket
                    tasks={draftTasks}
                    suggestions={suggestions}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onClear={handleClearBasket}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm bg-white/5 text-zinc-200 border border-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded-lg px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
            disabled={selectedIds.length === 0}
          >
            Accept Selected
          </button>
        </div>
      </div>
    </Modal>
  );
}
