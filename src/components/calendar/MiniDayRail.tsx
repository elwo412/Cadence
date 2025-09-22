import { usePlannerStore } from "../../hooks/usePlannerStore";
import { useDroppable } from "@dnd-kit/core";
import { NowLine } from "../NowLine";
import { SLOT_MIN } from "../../lib/time";
import { Task } from "../../types";
import { motion } from "framer-motion";
import { useState } from "react";

const HOUR_HEIGHT = (60 / SLOT_MIN) * 12; // 12px per slot

export function MiniDayRail() {
  const blocks = usePlannerStore((s) => s.blocks);
  const tasks = usePlannerStore((s) => s.tasks);
  const [isExpanded, setIsExpanded] = useState(false);

  const getTask = (id: string | null): Task | undefined => {
    if (!id) return undefined;
    return tasks.find((t) => t.id === id);
  };

  const { setNodeRef, isOver } = useDroppable({ id: "mini-day-rail" });

  return (
    <motion.aside
      ref={setNodeRef}
      className="bg-black/10 border-l border-white/10 h-full relative"
      initial={{ width: 72 }}
      animate={{
        width: isExpanded ? 240 : 72,
        boxShadow: isOver
          ? "0 0 20px 0 rgba(16, 185, 129, 0.5)"
          : "0 0 0 0 rgba(0,0,0,0)",
      }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
    >
      <div className="h-full overflow-auto relative">
        {/* Hour markers */}
        <div className="absolute inset-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] border-b border-white/5 text-right pr-2 text-[10px] text-zinc-500 pt-0.5"
              style={{ height: HOUR_HEIGHT }}
            >
              {i % 2 === 0 && `${String(i).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        <NowLine slotHeight={12} />

        {/* Blocks */}
        <div className="absolute inset-0">
          {blocks.map((block) => {
            const top = block.start_slot * 12;
            const height = (block.end_slot - block.start_slot) * 12;
            const task = getTask(block.task_id);
            return (
              <div
                key={block.id}
                className="absolute w-full px-1"
                style={{ top, height }}
              >
                <div
                  className="w-full h-full rounded-md bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-start pl-2"
                  title={task?.title}
                >
                  {isExpanded && task && (
                    <span className="text-xs text-emerald-100 whitespace-nowrap overflow-hidden">
                      {task.title}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}
