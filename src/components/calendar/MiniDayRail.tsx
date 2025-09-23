import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePlanner } from "@/state/planner";
import { DAY_END, DAY_START, SLOT_MIN, minsToHHMM } from "@/lib/time";
import { Task } from "@/types";

const SLOT_PX = 3; // Corresponds to 5 minute slots if SLOT_MIN is 5

export function MiniDayRail() {
  const [isExpanded, setIsExpanded] = useState(false);
  const tasks = usePlanner(s => s.tasks);
  const blocks = usePlanner(s => s.blocks);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayStartMin = DAY_START.split(":").map(Number).reduce((h, m) => h * 60 + m);
  const dayEndMin = DAY_END.split(":").map(Number).reduce((h, m) => h * 60 + m);
  const totalMinutes = dayEndMin - dayStartMin;

  const now = new Date();
  const nowPx = ((now.getHours() * 60 + now.getMinutes()) - dayStartMin) * SLOT_PX;

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
      className="relative h-full bg-[var(--card)] border-l border-t border-b border-[var(--card-border)] rounded-3xl overflow-hidden"
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
      <div className="absolute inset-0 overflow-auto thin-scroll" ref={scrollRef}>
        <div className="relative" style={{ height: totalMinutes * SLOT_PX }}>

          {/* Grid lines & Hour markers */}
          <div className="absolute inset-0">
            {Array.from({ length: (totalMinutes / SLOT_MIN) }).map((_, i) => {
              const absMin = dayStartMin + i * SLOT_MIN;
              if (absMin === dayStartMin) return null;

              const isHour = absMin % 60 === 0;
              const isHalfHour = absMin % 30 === 0;

              return (
                <div
                  key={i}
                  className="absolute left-2 right-2 border-t"
                  style={{
                    top: (absMin - dayStartMin) * SLOT_PX,
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
                    style={{ top: (hour * 60 - dayStartMin) * SLOT_PX }}
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
              className="absolute -translate-y-full right-1 text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ top: nowPx - 4, background: "rgba(255,85,102,0.2)", color: "var(--now)" }}
          >
              Now
          </div>

          {/* Blocks */}
          <div className="absolute inset-0">
            {blocks.map((block) => {
              const top = (block.startMin - dayStartMin) * SLOT_PX;
              const height = block.lengthMin * SLOT_PX;
              const task = getTask(block.taskId ?? null);
              const timeRange = `${minsToHHMM(block.startMin)} - ${minsToHHMM(block.startMin + block.lengthMin)}`;

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
      </div>
    </motion.aside>
  );
}
