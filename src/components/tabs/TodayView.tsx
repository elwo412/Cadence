import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayBlock, Task } from "../../types";
import {
  DAY_END,
  DAY_START,
  minsToHHMM,
  parseHHMM,
  SLOT_HEIGHT,
  SLOT_MIN,
} from "../../lib/time";
import { Trash2 } from "lucide-react";
import { overlaps } from "../../lib/utils";

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
  onDelete,
  isOverlapping,
  isSelected,
  onClick,
  onContextMenu,
}: {
  block: DayBlock;
  task: Task | undefined;
  onDelete: (id: string) => void;
  isOverlapping: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) => {
  const dayStartMin = parseHHMM(DAY_START);
  const {
    attributes: DndAttributes,
    listeners: dndListeners,
    setNodeRef: dndNodeRef,
  } = useDraggable({
    id: `block-${block.id}`,
    data: {
      type: "BLOCK_MOVE",
      block,
    },
  });

  const {
    listeners: topResizeListeners,
    attributes: topResizeAttributes,
    setNodeRef: topResizeRef,
  } = useDraggable({
    id: `resize-top-${block.id}`,
    data: {
      type: "BLOCK_RESIZE_TOP",
      block,
    },
  });

  const {
    listeners: bottomResizeListeners,
    attributes: bottomResizeAttributes,
    setNodeRef: bottomResizeRef,
  } = useDraggable({
    id: `resize-bottom-${block.id}`,
    data: {
      type: "BLOCK_RESIZE_BOTTOM",
      block,
    },
  });

  return (
    <div
      ref={dndNodeRef}
      onContextMenu={onContextMenu}
      className="absolute left-0 right-0"
      style={{
        top: ((block.startMin - dayStartMin) / SLOT_MIN) * SLOT_HEIGHT,
        height: (block.lengthMin / SLOT_MIN) * SLOT_HEIGHT,
      }}
    >
      <div
        onClick={onClick}
        {...dndListeners}
        {...DndAttributes}
        className={`flex items-center gap-2 rounded-xl border bg-black/40 p-2 h-full text-xs cursor-grab relative ${
          isOverlapping
            ? "border-red-500/50"
            : isSelected
            ? "border-blue-400"
            : "border-white/10"
        } ${isSelected ? "shadow-lg shadow-blue-500/20" : ""}`}
      >
        <div
          ref={topResizeRef}
          {...topResizeListeners}
          {...topResizeAttributes}
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10"
        />
        {task?.title ?? "Unknown Task"}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="absolute top-1 right-1 w-4 h-4 bg-black/30 rounded-full flex items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white z-20"
        >
          <Trash2 size={10} />
        </button>
        <div
          ref={bottomResizeRef}
          {...bottomResizeListeners}
          {...bottomResizeAttributes}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10"
        />
        {isOverlapping && (
          <div className="absolute top-1 right-7 text-[9px] bg-red-500/50 text-white rounded-sm px-1 z-20">
            Conflict
          </div>
        )}
      </div>
    </div>
  );
};

const NowLine = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const dayStartMin = parseHHMM(DAY_START);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < dayStartMin || nowMin > parseHHMM(DAY_END)) {
    return null;
  }

  const top = ((nowMin - dayStartMin) / SLOT_MIN) * SLOT_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 h-px bg-red-400 z-10"
      style={{ top }}
    >
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
    </div>
  );
};

type TodayViewProps = {
  blocks: DayBlock[];
  tasks: Task[];
  newBlock: DayBlock | null;
  activeBlock: DayBlock | null;
  previewBlock: DayBlock | null;
  onDeleteBlock: (id: string) => void;
  selectedBlockIds: string[];
  setSelectedBlockIds: (ids: string[]) => void;
  scheduledTaskIds: Set<string>;
  onContextMenu: (payload: { x: number; y: number; blockId: string }) => void;
};

const TodayView = React.forwardRef<HTMLDivElement, TodayViewProps>(
  (
    {
      blocks,
      tasks,
      newBlock,
      activeBlock,
      previewBlock,
      onDeleteBlock,
      selectedBlockIds,
      setSelectedBlockIds,
      scheduledTaskIds,
      onContextMenu,
    },
    ref
  ) => {
    const dayStartMin = useMemo(() => parseHHMM(DAY_START), []);
    const dayEndMin = useMemo(() => parseHHMM(DAY_END), []);
    const totalSlots = useMemo(
      () => (dayEndMin - dayStartMin) / SLOT_MIN,
      [dayStartMin, dayEndMin]
    );
    const gridRef = useRef<HTMLDivElement | null>(null);

    const minutesToY = useCallback(
      (min: number) => ((min - dayStartMin) / SLOT_MIN) * SLOT_HEIGHT,
      [dayStartMin]
    );

    useEffect(() => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (gridRef.current) {
        const y = ((nowMin - dayStartMin) / SLOT_MIN) * SLOT_HEIGHT;
        gridRef.current.scrollTop = Math.max(
          0,
          y - gridRef.current.clientHeight * 0.25
        );
      }
    }, [dayStartMin]);

    const { setNodeRef: gridDroppableRef } = useDroppable({ id: "today-grid" });
    const {
      attributes: gridDraggableAttr,
      listeners: gridDraggableListeners,
      setNodeRef: gridDraggableRef,
    } = useDraggable({ id: "grid-creator" });

    const setGridRefs = useCallback(
      (node: HTMLDivElement | null) => {
        gridRef.current = node;
        gridDroppableRef(node);
        gridDraggableRef(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [gridDroppableRef, gridDraggableRef, ref]
    );

    const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
      if (e.metaKey || e.ctrlKey) {
        setSelectedBlockIds(
          selectedBlockIds.includes(blockId)
            ? selectedBlockIds.filter((id) => id !== blockId)
            : [...selectedBlockIds, blockId]
        );
      } else {
        setSelectedBlockIds([blockId]);
      }
    };

    const GhostBlock = () => {
      const blockToRender = newBlock || activeBlock || previewBlock;
      if (!blockToRender) return null;

      const isOverlapping = blocks
        .filter((b) => b.id !== blockToRender.id)
        .some((other) => overlaps(blockToRender, other));

      return (
        <div
          className="absolute left-0 right-0 z-20"
          style={{
            top: minutesToY(blockToRender.startMin),
            height: (blockToRender.lengthMin / SLOT_MIN) * SLOT_HEIGHT,
          }}
        >
          <div
            className={`flex items-center gap-2 rounded-xl border p-2 h-full text-xs opacity-80 bg-white/10 ${
              isOverlapping
                ? "border-red-500/50"
                : "border-dashed border-white/40"
            }`}
          >
            {minsToHHMM(blockToRender.startMin)} -{" "}
            {minsToHHMM(blockToRender.startMin + blockToRender.lengthMin)} (
            {blockToRender.lengthMin}m)
          </div>
        </div>
      );
    };

    return (
      <div
        ref={gridRef}
        className="relative rounded-3xl border border-white/10 bg-transparent shadow-[0_0_110px_rgba(110,168,255,0.08)] h-full overflow-auto"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <div
          className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative h-full flex flex-col gap-4">
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
              style={{ height: totalSlots * SLOT_HEIGHT }}
            >
              {/* slot lines */}
              {[...Array(totalSlots)].map((_, i) => {
                const absMin = dayStartMin + i * SLOT_MIN;
                const isHour = absMin % 60 === 0;
                return (
                  <div
                    key={i}
                    style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    className={`absolute left-0 right-0 border-t ${
                      isHour ? "border-white/10" : "border-white/5"
                    } pointer-events-none ${i % 2 === 0 ? "bg-white/5" : ""}`}
                  />
                );
              })}

              {/* Ghost block for creation/movement */}
              <GhostBlock />

              {/* droppable slots */}
              {[...Array(totalSlots)].map((_, i) => {
                const time = dayStartMin + i * SLOT_MIN;
                return <DroppableSlot key={time} time={time} />;
              })}

              {/* now line */}
              <NowLine />

              {/* blocks overlay */}
              {blocks
                .filter((b) => b.id !== activeBlock?.id)
                .map((b) => {
                  const isOverlapping = blocks.some((other) => overlaps(b, other));
                  return (
                    <BlockCard
                      key={b.id}
                      block={b}
                      task={tasks.find((t) => t.id === b.taskId)}
                      onDelete={onDeleteBlock}
                      isOverlapping={isOverlapping}
                      isSelected={selectedBlockIds.includes(b.id)}
                      onClick={(e) => handleBlockClick(e, b.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onContextMenu({ x: e.clientX, y: e.clientY, blockId: b.id });
                      }}
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

export default TodayView;
