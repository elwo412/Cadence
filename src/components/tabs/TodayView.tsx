import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { DayBlock, Task } from "../../types";
import { uuid } from "../../lib/utils";
import {
  DAY_END,
  DAY_START,
  minsToHHMM,
  parseHHMM,
  SLOT_HEIGHT,
  SLOT_MIN,
} from "../../lib/time";

const DroppableSlot = ({ time }: { time: number }) => {
  const { setNodeRef } = useDroppable({ id: `slot-${time}` });
  const dayStartMin = parseHHMM(DAY_START);
  const i = (time - dayStartMin) / SLOT_MIN;
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        top: i * SLOT_HEIGHT,
        left: 0,
        right: 0,
        height: SLOT_HEIGHT,
      }}
    />
  );
};

const BlockCard = ({
  block,
  task,
}: {
  block: DayBlock;
  task: Task | undefined;
}) => {
  const dayStartMin = parseHHMM(DAY_START);
  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: ((block.startMin - dayStartMin) / SLOT_MIN) * SLOT_HEIGHT,
        height: (block.lengthMin / SLOT_MIN) * SLOT_HEIGHT,
      }}
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 h-full text-xs">
        {task?.title ?? "Unknown Task"}
      </div>
    </div>
  );
};

export default function TodayView({
  blocks,
  setBlocks,
  tasks,
}: {
  blocks: DayBlock[];
  setBlocks: (b: DayBlock[]) => void;
  tasks: Task[];
}) {
  const dayStartMin = parseHHMM(DAY_START);
  const dayEndMin = parseHHMM(DAY_END);
  const totalSlots = (dayEndMin - dayStartMin) / SLOT_MIN;

  return (
    <div className="relative rounded-3xl border border-white/10 bg-transparent shadow-[0_0_110px_rgba(110,168,255,0.08)] h-full overflow-hidden">
      <div
        className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative h-full flex flex-col gap-4 overflow-auto">
        <div className="grid grid-cols-[64px_1fr] flex-1">
          {/* time rail */}
          <div className="relative">
            {[...Array(totalSlots + 1)].map((_, i) => {
              const absMin = dayStartMin + i * SLOT_MIN;
              const isHour = absMin % 60 === 0;
              return (
                <div
                  key={i}
                  style={{ height: SLOT_HEIGHT }}
                  className={`text-[10px] text-zinc-500 px-2 text-right ${
                    isHour ? "border-t border-white/10" : ""
                  }`}
                >
                  {isHour ? minsToHHMM(absMin) : ""}
                </div>
              );
            })}
          </div>

          {/* grid body */}
          <div className="relative" style={{ height: totalSlots * SLOT_HEIGHT }}>
            {/* slot lines */}
            {[...Array(totalSlots + 1)].map((_, i) => (
              <div
                key={i}
                style={{ top: i * SLOT_HEIGHT }}
                className={`absolute left-0 right-0 border-t ${
                  i % 2 === 0 ? "border-white/10" : "border-white/5"
                } pointer-events-none`}
              />
            ))}

            {/* droppable slots */}
            {[...Array(totalSlots)].map((_, i) => {
              const time = dayStartMin + i * SLOT_MIN;
              return <DroppableSlot key={time} time={time} />;
            })}

            {/* blocks overlay */}
            {blocks.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                task={tasks.find((t) => t.id === b.taskId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
