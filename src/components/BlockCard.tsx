import React from "react";
import { DayBlock, Task } from "../types";
import { useDraggable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { DAY_START, minsToHHMM, parseHHMM, SLOT_MIN } from "../lib/time";
import Chip from "./Chip";

export const BlockCard = ({
  block,
  task,
  onDelete,
  isOverlapping,
  isSelected,
  onClick,
  onContextMenu,
  onDoubleClick,
  slotHeight,
}: {
  block: DayBlock;
  task: Task | undefined;
  onDelete: (id: string) => void;
  isOverlapping: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  slotHeight: number;
}) => {
  const dayStartMin = parseHHMM(DAY_START);
  const startMin = block.start_slot * SLOT_MIN;
  const lengthMin = (block.end_slot - block.start_slot) * SLOT_MIN;
  const {
    attributes: DndAttributes,
    listeners: dndListeners,
    setNodeRef: dndNodeRef,
  } = useDraggable({
    id: `block-${block.id}`,
    data: { type: "BLOCK_MOVE", block },
  });

  const {
    listeners: topResizeListeners,
    attributes: topResizeAttributes,
    setNodeRef: topResizeRef,
  } = useDraggable({
    id: `resize-top-${block.id}`,
    data: { type: "BLOCK_RESIZE_TOP", block },
  });

  const {
    listeners: bottomResizeListeners,
    attributes: bottomResizeAttributes,
    setNodeRef: bottomResizeRef,
  } = useDraggable({
    id: `resize-bottom-${block.id}`,
    data: { type: "BLOCK_RESIZE_BOTTOM", block },
  });

  return (
    <div
      ref={dndNodeRef}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      className="absolute left-0 right-0 group px-2 py-0.5"
      style={{
        top: ((startMin - dayStartMin) / SLOT_MIN) * slotHeight,
        height: (lengthMin / SLOT_MIN) * slotHeight,
      }}
    >
      <div
        onClick={onClick}
        {...dndListeners}
        {...DndAttributes}
        className={`glass relative flex flex-col justify-between rounded-lg px-2 py-1 h-full cursor-grab ${
          isOverlapping
            ? "border-red-500/50"
            : isSelected
            ? "border-blue-500/80"
            : ""
        } transition-colors duration-200`}
      >
        <div
          ref={topResizeRef}
          {...topResizeListeners}
          {...topResizeAttributes}
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize z-10 flex items-center justify-center"
        >
          <div className="w-6 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="font-medium text-zinc-100 text-sm truncate">
            {task?.title ?? "Unknown Task"}
          </div>
          {task?.tags && task.tags.length > 0 && lengthMin > 30 && (
            <div className="flex gap-1 mt-1.5">
              {task.tags.slice(0, 2).map((tag) => (
                <Chip key={tag} label={tag} />
              ))}
            </div>
          )}
        </div>

        {lengthMin > 30 && (
          <div className="text-zinc-400 text-[11px] mt-1">
            {minsToHHMM(startMin)} - {minsToHHMM(startMin + lengthMin)}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/30 rounded-full flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>

        <div
          ref={bottomResizeRef}
          {...bottomResizeListeners}
          {...bottomResizeAttributes}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize z-10 flex items-center justify-center"
        >
          <div className="w-6 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {isOverlapping && (
          <div className="absolute top-1.5 right-8 text-[9px] bg-red-500/80 text-white rounded-sm px-1 py-0.5 z-20">
            Conflict
          </div>
        )}
      </div>
    </div>
  );
};
