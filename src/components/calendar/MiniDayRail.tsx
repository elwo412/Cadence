import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useBlocks, useTasks } from "../../hooks/usePlannerStore";
import { DAY_END, DAY_START, SLOT_MIN, minsToHHMM } from "../../lib/time";
import { Task } from "../../types";

const SLOT_PX = 48;
const HOUR_HEIGHT = (60 / SLOT_MIN) * SLOT_PX;

export function MiniDayRail() {
  const [isExpanded, setIsExpanded] = useState(false);
  const tasks = useTasks();
  const blocks = useBlocks();
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayStartMin = DAY_START.split(":").map(Number)[0] * 60;
  const dayEndMin = DAY_END.split(":").map(Number)[0] * 60;
  const totalSlots = (dayEndMin - dayStartMin) / SLOT_MIN;

  const now = new Date();
  const nowPx = (now.getHours() * (60 / SLOT_MIN) + now.getMinutes() / SLOT_MIN) * SLOT_PX;

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) {
        const y = Math.max(0, nowPx - el.clientHeight * 0.25);
        el.scrollTop = y;
      }
    });
  }, []);

  const getTask = (id: string | null): Task | undefined => {
    if (!id) return undefined;
    return tasks.find((t) => t.id === id);
  };

  const { setNodeRef, isOver } = useDroppable({ id: "mini-day-rail" });

  return (
    <motion.aside
      ref={setNodeRef}
      className="relative bg-[var(--card)] border-l border-t border-b border-[var(--card-border)] rounded-3xl overflow-hidden"
      initial={{ width: 72 }}
      animate={{
        width: isExpanded ? 240 : 72,
        boxShadow: isOver
          ? "0 0 20px 0 rgba(16, 185, 129, 0.5)"
          : "0 0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
    >
      <div className="h-full overflow-auto relative thin-scroll" ref={scrollRef}>
        {/* Grid lines & Hour markers */}
        <div className="absolute inset-0">
          {Array.from({ length: totalSlots }).map((_, i) => {
            const absMin = dayStartMin + i * SLOT_MIN;
            if (absMin === dayStartMin) return null; // no line at the top

            const isHour = absMin % 60 === 0;
            const isHalfHour = absMin % 30 === 0;

            return (
              <div
                key={i}
                className="absolute left-2 right-2 border-t"
                style={{
                  top: i * SLOT_PX,
                  borderColor: isHour ? "var(--hour-line)" : "var(--half-line)",
                  borderStyle: isHour ? "solid" : (isHalfHour ? "dashed" : "dotted"),
                }}
              />
            );
          })}
          {isExpanded && (
            <div className="absolute inset-0">
              {Array.from({ length: 24 }).map((_, hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[10px] text-zinc-500"
                  style={{ top: hour * HOUR_HEIGHT }}
                >
                  {hour > 0 && `${String(hour).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Now-line + pill */}
        <div
            className="absolute left-1 right-1 h-px"
            style={{ top: nowPx, background: "var(--now)" }}
        />
        <div
            className="absolute -translate-y-1/2 right-1 text-[10px] px-1.5 py-0.5 rounded-md"
            style={{ top: nowPx, background: "rgba(255,85,102,0.2)", color: "var(--now)" }}
        >
            Now
        </div>

        {/* Blocks */}
        <div className="absolute inset-0">
          {blocks.map((block) => {
            const top = block.start_slot * SLOT_PX;
            const height = (block.end_slot - block.start_slot) * SLOT_PX;
            const task = getTask(block.task_id);
            const timeRange = `${minsToHHMM(block.start_slot * SLOT_MIN)} - ${minsToHHMM(block.end_slot * SLOT_MIN)}`;

            return (
              <div
                key={block.id}
                className="absolute left-1 right-1 rounded-xl p-[1px]"
                style={{
                  top,
                  height,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
                }}
                title={`${task?.title} (${timeRange})`}
              >
                <div className="h-full w-full rounded-[10px] bg-black/50 backdrop-blur-sm border border-white/10 text-[11px] px-2 py-1.5 overflow-hidden">
                  <div className="truncate text-zinc-100">{task?.title}</div>
                  <div className="text-[10px] text-zinc-400">{timeRange}</div>
                </div>
                {/* Resize handles */}
                <div className="absolute left-3 right-3 -top-1 h-2 cursor-n-resize" />
                <div className="absolute left-3 right-3 -bottom-1 h-2 cursor-s-resize" />
              </div>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}
