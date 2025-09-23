import { AnimatePresence, motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { useEffect, useRef, useState } from "react";
import { TimeGrid } from "../TimeGrid";
import { useTasks, useBlocks } from "../../hooks/usePlannerStore";
import { SLOT_MIN } from "../../lib/time";

export function DayPeek() {
  const [isOpen, setIsOpen] = useState(false);
  const tasks = useTasks();
  const blocks = useBlocks();
  const dayPeekGridRef = useRef<HTMLDivElement>(null);
  const zoom = 1.6; // Default zoom
  const slotHeight = 12 * zoom;

  useHotkeys("space", () => setIsOpen(true), { keydown: true });
  useHotkeys("space", () => setIsOpen(false), { keyup: true });

  useEffect(() => {
    if (isOpen && dayPeekGridRef.current) {
      const now = new Date();
      const top =
        (now.getHours() * (60 / SLOT_MIN) + now.getMinutes() / SLOT_MIN) *
        slotHeight;
      dayPeekGridRef.current.scrollTop =
        top - dayPeekGridRef.current.clientHeight / 2;
    }
  }, [isOpen, slotHeight]);

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
          <TimeGrid
            ref={dayPeekGridRef}
            tasks={tasks}
            blocks={blocks}
            newBlock={null}
            activeBlock={null}
            previewBlock={null}
            onDeleteBlock={() => {}}
            selectedBlockIds={[]}
            handleBlockClick={() => {}}
            onContextMenu={() => {}}
            onDoubleClickBlock={() => {}}
            slotHeight={slotHeight}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
