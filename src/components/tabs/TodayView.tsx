import { GripVertical, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from "react-beautiful-dnd";
import { TimeBlock } from "../../types";
import { uuid } from "../../lib/utils";

export default function TodayView({
  blocks,
  setBlocks,
}: {
  blocks: TimeBlock[];
  setBlocks: (b: TimeBlock[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(25);

  const addBlock = (p?: { label: string; duration: number }) => {
    const newBlock = {
      id: uuid(),
      label: p?.label || label || "New Block",
      start: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: p?.duration || duration,
    };
    setBlocks([...blocks, newBlock]);
    setLabel("");
    setDuration(25);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setBlocks(items);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_0_110px_rgba(110,168,255,0.08)] h-full flex flex-col gap-4">
      {/* Block list */}
      <div className="flex-1 overflow-auto pr-1">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {blocks.map((b, i) => (
                  <Draggable key={b.id} draggableId={b.id} index={i}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 mb-2"
                      >
                        <GripVertical className="text-zinc-500" />
                        <div className="flex-1 text-sm text-zinc-200">
                          {b.label}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {b.start} ({b.duration}m)
                        </div>
                        <button
                          className="text-zinc-500 hover:text-red-400"
                          onClick={() => deleteBlock(b.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Add block */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="New block…"
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
          />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-zinc-200 w-20"
          />
          <button
            onClick={() => addBlock()}
            className="rounded-lg bg-white text-black px-3 py-1.5 text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => addBlock({ label: "Deep Work", duration: 50 })}
            className="text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-md px-2 py-1"
          >
            + Deep Work (50m)
          </button>
          <button
            onClick={() => addBlock({ label: "Break", duration: 5 })}
            className="text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-md px-2 py-1"
          >
            + Break (5m)
          </button>
        </div>
      </div>
    </div>
  );
}
