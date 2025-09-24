import {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { RefObject, useState } from "react";
import { Block, Task } from "../types";
import { snapToGrid, yToSlot } from "../lib/timeGrid";
import { v4 as uuidv4 } from "uuid";

export const useCalendarDnD = (
  gridRef: RefObject<HTMLDivElement>,
  _tasks: Task[],
  _blocks: Block[],
  setBlocks: (blocks: Block[] | ((prev: Block[]) => Block[])) => void,
  slotHeight: number = 24
) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [newBlock, setNewBlock] = useState<Block | null>(null);
  const [previewBlock, setPreviewBlock] = useState<Block | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { type, task, block } = active.data.current ?? {};
    if (type === "TASK") setActiveTask(task);
    if (type === "BLOCK") setActiveBlock(block);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const { type, task } = active.data.current ?? {};

    if (!gridRef.current) return;
    const gridTop = gridRef.current.getBoundingClientRect().top;
    const startSlot = yToSlot(active.rect.current.initial!.top, gridTop, slotHeight);

    if (type === "TASK") {
      const estSlots = task
        ? Math.ceil(task.est_minutes / 15)
        : 4;
      setNewBlock({
        id: "preview",
        taskId: task!.id,
        dateISO: new Date().toISOString().split("T")[0],
        startMin: startSlot,
        lengthMin: estSlots * 15,
        kind: 'atomic',
      });
    }

    if (type === "BLOCK" && activeBlock) {
      const snappedY = snapToGrid(delta.y, slotHeight);
      const startOffset = Math.round(snappedY / slotHeight);
      setPreviewBlock({
        ...activeBlock,
        startMin: activeBlock.startMin + startOffset,
        lengthMin: activeBlock.lengthMin,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    if (newBlock && over?.id === "calendar-grid") {
      setBlocks((prev) => [...prev, { ...newBlock, id: uuidv4() }]);
    }
    if (previewBlock && over?.id === "calendar-grid") {
      setBlocks((prev) =>
        prev.map((b) => (b.id === previewBlock.id ? previewBlock : b))
      );
    }
    setActiveTask(null);
    setActiveBlock(null);
    setNewBlock(null);
    setPreviewBlock(null);
  };

  const handleDragOver = () => {
    // Required for dnd-kit to detect overlaps
  };

  return {
    activeTask,
    activeBlock,
    newBlock,
    previewBlock,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragOver,
  };
};
