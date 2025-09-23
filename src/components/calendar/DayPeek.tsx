import { AnimatePresence, motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { forwardRef, useEffect, useRef, useState } from "react";
import { TimeGrid } from "@/components/TimeGrid";
import { usePlanner } from "@/state/planner";
import { SLOT_MIN } from "@/lib/time";

export const DayPeek = forwardRef<HTMLDivElement>((_props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const tasks = usePlanner(s => s.tasks);
  const blocks = usePlanner(s => s.blocks);
  const internalRef = useRef<HTMLDivElement>(null);
  const zoom = 1.6; // Default zoom
  const slotHeight = 12 * zoom;

  useHotkeys("space", () => setIsOpen(true), { keydown: true });
  useHotkeys("space", () => setIsOpen(false), { keyup: true });

  const setRefs = (node: HTMLDivElement | null) => {
    // @ts-ignore
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    if (isOpen && internalRef.current) {
      const now = new Date();
      const top =
        (now.getHours() * (60 / SLOT_MIN) + now.getMinutes() / SLOT_MIN) *
        slotHeight;
      internalRef.current.scrollTop =
        top - internalRef.current.clientHeight / 2;
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
            ref={setRefs}
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
});

DayPeek.displayName = "DayPeek";
