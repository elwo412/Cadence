import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, List, Wand2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import Modal from "./Modal";
import { ParsedTask, parseLines } from "../lib/parsing";

type TaskComposerProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (tasks: ParsedTask[]) => void;
};

type Tab = "quick" | "multi" | "refine";

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
  onCreate,
}: TaskComposerProps) {
  const [tab, setTab] = useState<Tab>("quick");
  const [quickInput, setQuickInput] = useState("");
  const [multiInput, setMultiInput] = useState("");

  const handleCreate = () => {
    let parsed: ParsedTask[] = [];
    if (tab === "quick") {
      parsed = parseLines(quickInput);
    } else if (tab === "multi") {
      parsed = parseLines(multiInput);
    }
    onCreate(parsed);
    setQuickInput("");
    setMultiInput("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Task Composer"
      // className="max-w-xl"
    >
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-black/20 border border-white/10">
          <TabButton active={tab === "quick"} onClick={() => setTab("quick")}>
            <div className="flex items-center justify-center gap-2">
              <Wand2 size={16} /> Quick Add
            </div>
          </TabButton>
          <TabButton active={tab === "multi"} onClick={() => setTab("multi")}>
            <div className="flex items-center justify-center gap-2">
              <List size={16} /> Multi-line
            </div>
          </TabButton>
          <TabButton active={tab === "refine"} onClick={() => setTab("refine")}>
            <div className="flex items-center justify-center gap-2">
              <BrainCircuit size={16} /> AI Refine
            </div>
          </TabButton>
        </div>

        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {tab === "quick" && (
                <div>
                  <input
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="A single task with #tags ~30m !p1..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                  />
                  <p className="text-xs text-zinc-500 mt-2 px-1">
                    The full parsing syntax is supported here.
                  </p>
                </div>
              )}
              {tab === "multi" && (
                <div>
                  <textarea
                    value={multiInput}
                    onChange={(e) => setMultiInput(e.target.value)}
                    placeholder="Paste a list of tasks, one per line..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20 h-40"
                  />
                  <p className="text-xs text-zinc-500 mt-2 px-1">
                    Each line will be parsed as a separate task.
                  </p>
                </div>
              )}
              {tab === "refine" && (
                <div className="text-center text-zinc-400 p-8 border border-dashed border-white/10 rounded-lg">
                  <p>AI Refinement is not yet implemented.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    This will allow you to improve existing tasks.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Preview section will go here */}

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
          >
            Accept
          </button>
        </div>
      </div>
    </Modal>
  );
}
