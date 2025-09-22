import React, { forwardRef, useCallback, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DayBlock, Task } from "../types";
import {
  DAY_END,
  DAY_START,
  minsToHHMM,
  parseHHMM,
  SLOT_MIN,
} from "../lib/time";
import { DroppableSlot } from "./DroppableSlot";
import { overlaps } from "../lib/utils";
import { NowLine } from "./NowLine";
import { BlockCard } from "./BlockCard";

type TimeGridProps = {
  slotHeight: number;
  newBlock: DayBlock | null;
  activeBlock: DayBlock | null;
  previewBlock: DayBlock | null;
  blocks: DayBlock[];
  tasks: Task[];
  onDeleteBlock: (id: string) => void;
  selectedBlockIds: string[];
  handleBlockClick: (e: React.MouseEvent, blockId: string) => void;
  onContextMenu: (payload: { x: number; y: number; blockId: string }) => void;
  onDoubleClickBlock: (blockId: string) => void;
};

export const TimeGrid = forwardRef<HTMLDivElement, TimeGridProps>(
  (
    {
      slotHeight,
      newBlock,
      activeBlock,
      previewBlock,
      blocks,
      tasks,
      onDeleteBlock,
      selectedBlockIds,
      handleBlockClick,
      onContextMenu,
      onDoubleClickBlock,
    },
    ref
  ) => {
    const dayStartMin = parseHHMM(DAY_START);
    const dayEndMin = parseHHMM(DAY_END);
    const totalSlots = (dayEndMin - dayStartMin) / SLOT_MIN;

    const gridRef = useRef<HTMLDivElement | null>(null);

    const { setNodeRef: gridDroppableRef } = useDroppable({ id: "today-grid" });
    const {
      attributes: gridDraggableAttr,
      listeners: gridDraggableListeners,
      setNodeRef: gridDraggableRef,
    } = useDraggable({ id: "grid-creator" });

    const setGridRefs = useCallback(
      (node: HTMLDivElement | null) => {
        gridDroppableRef(node);
        gridDraggableRef(node);
        gridRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [gridDroppableRef, gridDraggableRef, ref]
    );

    const minutesToY = useCallback(
      (min: number) => ((min - dayStartMin) / SLOT_MIN) * slotHeight,
      [dayStartMin, slotHeight]
    );

    const GhostBlock = () => {
      const blockToRender = newBlock || activeBlock || previewBlock;
      if (!blockToRender) return null;

      const startMin = blockToRender.start_slot * SLOT_MIN;
      const lengthMin =
        (blockToRender.end_slot - blockToRender.start_slot) * SLOT_MIN;

      const isOverlapping = blocks
        .filter((b) => b.id !== blockToRender.id)
        .some((other) => overlaps(blockToRender, other));

      return (
        <div
          className="absolute left-0 right-0 z-20"
          style={{
            top: minutesToY(startMin),
            height: (lengthMin / SLOT_MIN) * slotHeight,
          }}
        >
          <div
            className={`flex items-center gap-2 rounded-xl border p-2 h-full text-xs opacity-80 bg-white/10 ${
              isOverlapping
                ? "border-red-500/50"
                : "border-dashed border-white/40"
            }`}
          >
            {minsToHHMM(startMin)} - {minsToHHMM(startMin + lengthMin)} (
            {lengthMin}m)
          </div>
        </div>
      );
    };

    return (
      <div ref={gridRef} className="h-full overflow-auto">
        <div className="relative p-1">
          <div className="grid grid-cols-[64px_1fr]">
            {/* time rail */}
            <div className="relative">
              {[...Array(totalSlots + 1)].map((_, i) => {
                const absMin = dayStartMin + i * SLOT_MIN;
                const isHour = absMin % 60 === 0;
                return (
                  <div
                    key={i}
                    style={{ height: slotHeight }}
                    className={`text-[10px] text-zinc-500 px-2 text-right relative ${
                      isHour ? "" : ""
                    }`}
                  >
                    {isHour ? (
                      <>
                        <span className="absolute -top-[7px] right-2">
                          {minsToHHMM(absMin)}
                        </span>
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                );
              })}
            </div>

            {/* grid body */}
            <div
              ref={setGridRefs}
              {...gridDraggableAttr}
              {...gridDraggableListeners}
              className="relative"
              style={{ height: totalSlots * slotHeight }}
            >
              {/* slot lines */}
              {[...Array(totalSlots)].map((_, i) => {
                const absMin = dayStartMin + i * SLOT_MIN;
                const isHour = absMin % 60 === 0;
                if (!isHour) return null;
                return (
                  <div
                    key={i}
                    style={{ top: i * slotHeight, height: slotHeight }}
                    className="absolute left-0 right-0 border-t border-white/10 pointer-events-none"
                  />
                );
              })}

              <GhostBlock />

              {/* droppable slots */}
              {[...Array(totalSlots)].map((_, i) => {
                const time = dayStartMin + i * SLOT_MIN;
                return (
                  <DroppableSlot
                    key={time}
                    time={time}
                    slotHeight={slotHeight}
                  />
                );
              })}

              <NowLine slotHeight={slotHeight} />

              {blocks
                .filter((b) => b.id !== activeBlock?.id)
                .map((b) => {
                  const isOverlapping = blocks.some((other) =>
                    overlaps(b, other)
                  );
                  return (
                    <BlockCard
                      key={b.id}
                      block={b}
                      task={tasks.find((t) => t.id === b.task_id)}
                      onDelete={onDeleteBlock}
                      isOverlapping={isOverlapping}
                      isSelected={selectedBlockIds.includes(b.id)}
                      onClick={(e) => handleBlockClick(e, b.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          blockId: b.id,
                        });
                      }}
                      onDoubleClick={() => onDoubleClickBlock(b.id)}
                      slotHeight={slotHeight}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
