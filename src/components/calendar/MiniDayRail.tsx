import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import usePlanner from "@/state/planner";
import { DAY_END, DAY_START, SLOT_MIN, minsToHHMM } from "@/lib/time";
import { Task } from "@/types";
import { cn } from "@/lib/utils";

const SLOT_PX = 3; // Corresponds to 5 minute slots if SLOT_MIN is 5
const PREVIEW_SLOT_MIN = 15;

function DroppableSlot({ absMin }: { absMin: number }) {
  const { setNodeRef } = useDroppable({ id: `slot-${absMin}` });
  const dayStartMin = DAY_START.split(":").map(Number).reduce((h, m) => h * 60 + m);

  return (
    <div
      ref={setNodeRef}
      className="z-10"
      style={{
        position: "absolute",
        top: (absMin - dayStartMin) * SLOT_PX,
        height: PREVIEW_SLOT_MIN * SLOT_PX,
        left: 0,
        right: 0,
      }}
    />
  );
}

export function MiniDayRail() {
  const tasks = usePlanner(s => s.tasks);
  const blocks = usePlanner(s => s.blocks);
  const previewBlock = usePlanner(s => s.previewBlock);
  const isHoveringMiniDayRail = usePlanner(s => s.isHoveringMiniDayRail);
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
  }, [nowPx]);

  const getTask = (id: string | null): Task | undefined => {
    if (!id) return undefined;
    return tasks.find((t) => t.id === id);
  };

  return (
    <motion.aside
      className="relative h-full bg-[var(--card)] border-l border-t border-b border-[var(--card-border)] rounded-3xl overflow-hidden"
      initial={{ width: 240 }}
      animate={{
        width: 240,
        boxShadow: isHoveringMiniDayRail
          ? "0 0 20px 0 rgba(16, 185, 129, 0.5)"
          : "0 0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 overflow-auto thin-scroll" ref={scrollRef}>
        <div className="relative" style={{ height: totalMinutes * SLOT_PX }}>
          {/* Layer 1: Grid lines & Hour markers (visuals) */}
          <div className="absolute inset-0">
            {Array.from({ length: totalMinutes / SLOT_MIN }).map((_, i) => {
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
                    borderStyle:
                      isHour ? "solid" : isHalfHour ? "dashed" : "dotted",
                  }}
                />
              );
            })}
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
          </div>

          {/* Layer 2: Now-line (visual) */}
          <div
            className="absolute left-1 right-1 h-px"
            style={{ top: nowPx, background: "var(--now)" }}
          />
          <div
            className="absolute -translate-y-full right-1 text-[10px] px-1.5 py-0.5 rounded-md"
            style={{
              top: nowPx - 4,
              background: "rgba(255,85,102,0.2)",
              color: "var(--now)",
            }}
          >
            Now
          </div>

          {/* Layer 3: Scheduled Blocks & Preview (visuals) */}
          <div className="absolute inset-0">
            {[...blocks, ...(previewBlock ? [previewBlock] : [])].map((block) => {
              const top = (block.startMin - dayStartMin) * SLOT_PX;
              const height = block.lengthMin * SLOT_PX;
              const task = getTask(block.taskId ?? null);
              const timeRange = `${minsToHHMM(block.startMin)} - ${minsToHHMM(
                block.startMin + block.lengthMin
              )}`;
              const isPreview = block.id === 'preview-block';

              return (
                <div
                  key={block.id}
                  className={cn(
                    "absolute left-1 right-1 rounded-xl p-[1px]",
                    isPreview && "opacity-70 z-20 pointer-events-none"
                  )}
                  style={{
                    top,
                    height,
                    background: isPreview
                      ? "none"
                      : "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))",
                    boxShadow: isPreview
                      ? "none"
                      : "0 6px 24px rgba(0,0,0,0.35)",
                  }}
                  title={`${task?.title} (${timeRange})`}
                >
                  {isPreview ? (
                    <div className="h-full w-full rounded-[10px] border-2 border-dashed border-emerald-400 bg-emerald-500/10" />
                  ) : (
                    <div className="h-full w-full rounded-[10px] bg-black/50 backdrop-blur-sm border border-white/10 text-[11px] px-2 py-1.5 overflow-hidden">
                      <div className="truncate text-zinc-100">{task?.title}</div>
                      <div className="text-[10px] text-zinc-400">
                        {timeRange}
                      </div>
                    </div>
                  )}

                  {/* Resize handles */}
                  {!isPreview && (
                    <>
                      <div className="absolute left-3 right-3 -top-1 h-2 cursor-n-resize" />
                      <div className="absolute left-3 right-3 -bottom-1 h-2 cursor-s-resize" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Layer 4: Droppable zones (interaction) */}
          <div className="absolute inset-0 z-10">
            {Array.from({ length: totalMinutes / PREVIEW_SLOT_MIN }).map((_, i) => {
              const absMin = dayStartMin + i * PREVIEW_SLOT_MIN;
              return <DroppableSlot key={absMin} absMin={absMin} />;
            })}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
