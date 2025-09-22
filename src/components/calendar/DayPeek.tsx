import { AnimatePresence, motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import TodayView from "../tabs/TodayView";
import { usePlannerStore } from "../../hooks/usePlannerStore";

export function DayPeek() {
  const [isOpen, setIsOpen] = useState(false);
  const { tasks, blocks } = usePlannerStore();
  useHotkeys("space", () => setIsOpen(true), { keydown: true });
  useHotkeys("space", () => setIsOpen(false), { keyup: true });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-y-0 right-0 w-[480px] bg-black/50 backdrop-blur-lg border-l border-white/10 shadow-2xl z-50"
          initial={{ x: "100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <TodayView
            // These props will need to be properly wired up
            tasks={tasks}
            blocks={blocks}
            newBlock={null}
            activeBlock={null}
            previewBlock={null}
            onDeleteBlock={() => {}}
            selectedBlockIds={[]}
            setSelectedBlockIds={() => {}}
            onContextMenu={() => {}}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
