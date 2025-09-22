import { useRef, useState } from "react";
import { DayBlock, Task } from "../types";
import { GridMetrics, yToMinutes } from "../lib/timeGrid";
import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  DAY_END,
  DAY_START,
  SLOT_MIN,
} from "../lib/time";
import { parseHHMM } from "../lib/time";
import { uuid } from "../lib/utils";

const minsToSlots = (mins: number) => Math.round(mins / SLOT_MIN);

export const useCalendarDnD = (
  gridRef: React.RefObject<HTMLDivElement>,
  tasks: Task[],
  _blocks: DayBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<DayBlock[]>>,
  slotHeight: number,
) => {
  const [newBlock, setNewBlock] = useState<DayBlock | null>(null);
  const [previewBlock, setPreviewBlock] = useState<DayBlock | null>(null);
  const [activeBlock, setActiveBlock] = useState<DayBlock | null>(null);
  const [resizeMode, setResizeMode] = useState<"top" | "bottom" | null>(null);
  const dragInfo = useRef<{
    start_slot: number;
    end_slot: number;
    grabOffset_slot: number;
    metrics: GridMetrics;
  } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { current } = active.data;
    const type = current?.type;

    if (!gridRef.current) return;

    const metrics: GridMetrics = {
      el: gridRef.current,
      dayStartMin: parseHHMM(DAY_START),
      dayEndMin: parseHHMM(DAY_END),
      slotHeight,
    };

    const startY = (event.activatorEvent as PointerEvent).clientY;
    const startMin = yToMinutes(startY, metrics);
    const startSlot = minsToSlots(startMin);

    if (type === "BLOCK_MOVE" || type?.startsWith("BLOCK_RESIZE")) {
      const block = current?.block as DayBlock;
      setActiveBlock(block);
      dragInfo.current = {
        start_slot: block.start_slot,
        end_slot: block.end_slot,
        grabOffset_slot: startSlot - block.start_slot,
        metrics,
      };

      if (type === "BLOCK_RESIZE_TOP") setResizeMode("top");
      if (type === "BLOCK_RESIZE_BOTTOM") setResizeMode("bottom");
    } else if (active.id === "grid-creator") {
      const newB: DayBlock = {
        id: "NEW_BLOCK",
        task_id: tasks[0]?.id || "temp",
        date: "", // This will be set on drop
        start_slot: startSlot,
        end_slot: startSlot + 1,
      };
      setNewBlock(newB);
      dragInfo.current = {
        start_slot: newB.start_slot,
        end_slot: newB.end_slot,
        grabOffset_slot: 0,
        metrics,
      };
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta, activatorEvent } = event;
    if (!dragInfo.current) return;

    const { metrics, start_slot, end_slot, grabOffset_slot } = dragInfo.current;

    const initialY = (activatorEvent as PointerEvent).clientY;
    const currentY = initialY + delta.y;
    const currentMin = yToMinutes(currentY, metrics);
    const currentSlot = minsToSlots(currentMin);

    if (newBlock) {
      const new_end_slot = currentSlot;
      if (new_end_slot > newBlock.start_slot) {
        setNewBlock({ ...newBlock, end_slot: new_end_slot });
      }
    } else if (activeBlock) {
      if (resizeMode === "top") {
        const new_start_slot = Math.min(currentSlot, end_slot - 1);
        if (new_start_slot < end_slot) {
          setActiveBlock({
            ...activeBlock,
            start_slot: new_start_slot,
          });
        }
      } else if (resizeMode === "bottom") {
        const new_end_slot = Math.max(currentSlot, start_slot + 1);
        if (new_end_slot > start_slot) {
          setActiveBlock({ ...activeBlock, end_slot: new_end_slot });
        }
      } else {
        const new_start_slot = currentSlot - grabOffset_slot;
        const length = end_slot - start_slot;
        setActiveBlock({
          ...activeBlock,
          start_slot: new_start_slot,
          end_slot: new_start_slot + length,
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (newBlock) {
      const finalBlock = { ...newBlock, id: uuid() };
      setBlocks((bs) => [...bs, finalBlock]);
    } else if (activeBlock) {
      setBlocks((bs) =>
        bs.map((b) => (b.id === activeBlock.id ? activeBlock : b))
      );
    } else if (
      over &&
      active.data.current?.type === "TASK" &&
      String(over.id).startsWith("slot-")
    ) {
      const task = active.data.current?.task as Task;
      const startMin = Number(String(over.id).replace("slot-", ""));
      const start_slot = minsToSlots(startMin);
      const length_slots = minsToSlots(
        Math.max(30, task.est_minutes ?? 30)
      );
      const newB: DayBlock = {
        id: uuid(),
        task_id: task.id,
        date: "", // This should be passed in
        start_slot,
        end_slot: start_slot + length_slots,
      };
      setBlocks((b) => [...b, newB]);
    }

    if (activeBlock && over?.id === "unscheduled-tray") {
      setBlocks((bs) => bs.filter((b) => b.id !== activeBlock.id));
    }

    setActiveBlock(null);
    setNewBlock(null);
    setPreviewBlock(null);
    setResizeMode(null);
    dragInfo.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (
      !over ||
      active.data.current?.type !== "TASK" ||
      !String(over.id).startsWith("slot-")
    ) {
      if (previewBlock) setPreviewBlock(null);
      return;
    }

    const task = active.data.current?.task as Task;
    const startMin = Number(String(over.id).replace("slot-", ""));
    const start_slot = minsToSlots(startMin);
    const length_slots = minsToSlots(Math.max(30, task.est_minutes ?? 30));

    const newB: DayBlock = {
      id: "PREVIEW",
      task_id: task.id,
      date: "",
      start_slot,
      end_slot: start_slot + length_slots,
    };
    setPreviewBlock(newB);
  };
  return {
    newBlock,
    previewBlock,
    activeBlock,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragOver,
  };
};
