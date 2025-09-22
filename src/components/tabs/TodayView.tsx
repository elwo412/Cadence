import React, { useEffect, useMemo } from "react";
import { DayBlock, Task } from "../../types";
import { DAY_START, parseHHMM, SLOT_MIN } from "../../lib/time";
import { Search } from "lucide-react";
import { TimeGrid } from "../TimeGrid";

type TodayViewProps = {
    blocks: DayBlock[];
    tasks: Task[];
    newBlock: DayBlock | null;
    activeBlock: DayBlock | null;
    previewBlock: DayBlock | null;
    onDeleteBlock: (id: string) => void;
    selectedBlockIds: string[];
    setSelectedBlockIds: (ids: string[]) => void;
    onContextMenu: (payload: { x: number; y: number; blockId: string }) => void;
    onDoubleClickBlock: (blockId: string) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    slotHeight: number;
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
            onContextMenu,
            onDoubleClickBlock,
            zoom,
            setZoom,
            slotHeight,
        },
        ref
    ) => {
        const dayStartMin = useMemo(() => parseHHMM(DAY_START), []);

        useEffect(() => {
            const nowMin = 8 * 60;
            if (ref && "current" in ref && ref.current) {
                const y = ((nowMin - dayStartMin) / SLOT_MIN) * slotHeight;
                ref.current.scrollTop = Math.max(
                    0,
                    y - ref.current.clientHeight * 0.25
                );
            }
        }, [dayStartMin, slotHeight, ref]);

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

        return (
            <div
                className="glass relative rounded-3xl h-full flex flex-col overflow-hidden"
                style={{ touchAction: "none", userSelect: "none" }}
            >
                <button
                    onClick={() => setZoom(zoom === 1.6 ? 0.7 : 1.6)}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-zinc-400 hover:text-white"
                    title="Toggle zoom"
                >
                    <Search size={16} />
                </button>
                <TimeGrid
                    ref={ref}
                    slotHeight={slotHeight}
                    newBlock={newBlock}
                    activeBlock={activeBlock}
                    previewBlock={previewBlock}
                    blocks={blocks}
                    tasks={tasks}
                    onDeleteBlock={onDeleteBlock}
                    selectedBlockIds={selectedBlockIds}
                    handleBlockClick={handleBlockClick}
                    onContextMenu={onContextMenu}
                    onDoubleClickBlock={onDoubleClickBlock}
                />
            </div>
        );
    }
);

export default TodayView;
