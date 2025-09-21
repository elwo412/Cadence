import { useRef, useState } from "react";
import { DayBlock, Task } from "../types";
import { GridMetrics, yToMinutes, roundTo, clampStart } from "../lib/timeGrid";
import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { DAY_END, DAY_START, NUDGE_MIN, SLOT_MIN } from "../lib/time";
import { parseHHMM, roundToSlot } from "../lib/time";
import { uuid } from "../lib/utils";

export const useCalendarDnD = (
  gridRef: React.RefObject<HTMLDivElement>,
  tasks: Task[],
  blocks: DayBlock[],
  setBlocks: React.Dispatch<React.SetStateAction<DayBlock[]>>
) => {
  const [newBlock, setNewBlock] = useState<DayBlock | null>(null);
  const [previewBlock, setPreviewBlock] = useState<DayBlock | null>(null);
  const [activeBlock, setActiveBlock] = useState<DayBlock | null>(null);
  const [resizeMode, setResizeMode] = useState<"top" | "bottom" | null>(null);
  const dragInfo = useRef<{
    startMin: number;
    lengthMin: number;
    grabOffsetMin: number;
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
      totalSlots: (parseHHMM(DAY_END) - parseHHMM(DAY_START)) / SLOT_MIN,
    };

    const startY = (event.activatorEvent as PointerEvent).clientY;
    const startMin = yToMinutes(startY, metrics);

    if (type === "BLOCK_MOVE" || type?.startsWith("BLOCK_RESIZE")) {
      const block = current?.block as DayBlock;
      setActiveBlock(block);
      dragInfo.current = {
        startMin: block.startMin,
        lengthMin: block.lengthMin,
        grabOffsetMin: startMin - block.startMin,
        metrics,
      };

      if (type === "BLOCK_RESIZE_TOP") setResizeMode("top");
      if (type === "BLOCK_RESIZE_BOTTOM") setResizeMode("bottom");
    } else if (active.id === "grid-creator") {
      const snappedStart = roundTo(startMin, SLOT_MIN);
      const newB: DayBlock = {
        id: "NEW_BLOCK",
        taskId: tasks[0]?.id || "temp",
        startMin: snappedStart,
        lengthMin: SLOT_MIN,
      };
      setNewBlock(newB);
      dragInfo.current = {
        startMin: newB.startMin,
        lengthMin: newB.lengthMin,
        grabOffsetMin: 0,
        metrics,
      };
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta, activatorEvent } = event;
    if (!dragInfo.current) return;

    const { metrics, startMin, lengthMin, grabOffsetMin } = dragInfo.current;
    const step = (activatorEvent as PointerEvent).altKey ? 5 : SLOT_MIN;

    const initialY = (activatorEvent as PointerEvent).clientY;
    const currentY = initialY + delta.y;
    const currentMin = yToMinutes(currentY, metrics);

    if (newBlock) {
      const newLength = roundTo(currentMin - newBlock.startMin, step);
      if (newLength >= SLOT_MIN) {
        setNewBlock({ ...newBlock, lengthMin: newLength });
      }
    } else if (activeBlock) {
      if (resizeMode === "top") {
        const snappedMin = roundTo(currentMin, step);
        const endMin = startMin + lengthMin;
        const newStart = clampStart(snappedMin, SLOT_MIN, metrics);
        const newLength = endMin - newStart;
        if (newLength >= SLOT_MIN) {
          setActiveBlock({
            ...activeBlock,
            startMin: newStart,
            lengthMin: newLength,
          });
        }
      } else if (resizeMode === "bottom") {
        const newLength = roundTo(currentMin - activeBlock.startMin, step);
        if (newLength >= SLOT_MIN) {
          setActiveBlock({ ...activeBlock, lengthMin: newLength });
        }
      } else {
        const snappedMin = roundTo(currentMin - grabOffsetMin, step);
        const newStart = clampStart(snappedMin, lengthMin, metrics);
        setActiveBlock({ ...activeBlock, startMin: newStart });
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
      const task = active.data.current?.task;
      const startMin = Number(String(over.id).replace("slot-", ""));
      const lengthMin = roundToSlot(Math.max(30, task.est ?? 30));
      const newB: DayBlock = {
        id: uuid(),
        taskId: task.id,
        startMin: startMin,
        lengthMin: lengthMin,
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

    const task = active.data.current?.task;
    const startMin = Number(String(over.id).replace("slot-", ""));
    const lengthMin = roundToSlot(Math.max(30, task.est ?? 30));
    const newB: DayBlock = {
      id: "PREVIEW",
      taskId: task.id,
      startMin: startMin,
      lengthMin: lengthMin,
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
