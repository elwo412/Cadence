import { useDraggable } from "@dnd-kit/core";
import { Block, Task } from "../types";
import { minsToHHMM, parseHHMM, SLOT_MIN } from "../lib/time";
import { DAY_START } from "../lib/time";
import { cn } from "../lib/utils";

type BlockCardProps = {
  block: Block;
  task?: Task;
  onDelete: (id: string) => void;
  isOverlapping: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  slotHeight: number;
};

export function BlockCard({
  block,
  task,
  onDelete,
  isOverlapping,
  isSelected,
  onClick,
  onContextMenu,
  onDoubleClick,
  slotHeight,
}: BlockCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
    data: { type: "BLOCK", block },
  });

  const dayStartMin = parseHHMM(DAY_START);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        top: ((block.startMin - dayStartMin) / SLOT_MIN) * slotHeight,
        height: (block.lengthMin / SLOT_MIN) * slotHeight,
      }
    : {
        top: ((block.startMin - dayStartMin) / SLOT_MIN) * slotHeight,
        height: (block.lengthMin / SLOT_MIN) * slotHeight,
      };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute left-0 right-0 z-10 p-0.5 rounded-xl cursor-grab",
        isOverlapping && "z-0",
        isSelected && "ring-2 ring-blue-500 z-20"
      )}
    >
      <div className="relative w-full h-full rounded-[10px] bg-white/10 p-2 text-xs flex flex-col justify-between overflow-hidden">
        <div>
          <div className="font-semibold text-zinc-100">{task?.title}</div>
          <div className="text-zinc-400">
            {minsToHHMM(block.startMin)} - {minsToHHMM(block.startMin + block.lengthMin)}
          </div>
        </div>
        <div className="text-zinc-400">{block.lengthMin}m</div>
      </div>
    </div>
  );
}
