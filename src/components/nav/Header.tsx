import { usePlannerStore } from "../../hooks/usePlannerStore";
import { useMemo } from "react";
import { minsToHHMM, SLOT_MIN } from "../../lib/time";
import { Bell, MoreHorizontal } from "lucide-react";
import { Menu } from "@headlessui/react";
import { useDraggable } from "@dnd-kit/core";
import { DragData } from "../../lib/timeGrid";

export function Header() {
  const { blocks, tasks, setBlocks } = usePlannerStore();

  const nextBlock = useMemo(() => {
    const now = new Date();
    const nowSlot = now.getHours() * (60 / SLOT_MIN) + now.getMinutes() / SLOT_MIN;
    return blocks
      .filter((b) => b.start_slot > nowSlot)
      .sort((a, b) => a.start_slot - b.start_slot)[0];
  }, [blocks]);

  const nextTask = useMemo(() => {
    if (!nextBlock) return null;
    return tasks.find((t) => t.id === nextBlock.task_id);
  }, [nextBlock, tasks]);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `block-drag-${nextBlock?.id}`,
    data: {
      type: "BLOCK",
      block: nextBlock,
    } as DragData,
    disabled: !nextBlock,
  });

  const handleSnooze = () => {
    if (!nextBlock) return;
    const snoozedBlock = {
      ...nextBlock,
      start_slot: nextBlock.start_slot + 2, // Snooze by 10 mins (2 slots)
      end_slot: nextBlock.end_slot + 2,
    };
    setBlocks((prev) =>
      prev.map((b) => (b.id === nextBlock.id ? snoozedBlock : b))
    );
  };

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        {nextBlock && nextTask ? (
          <div className="flex items-center gap-3">
            <div
              ref={setNodeRef}
              {...listeners}
              {...attributes}
              className="flex items-center gap-3 cursor-grab"
            >
              <div className="text-sm text-zinc-400">Next:</div>
              <div className="text-sm font-medium text-white">
                {minsToHHMM(nextBlock.start_slot * SLOT_MIN)} {nextTask.title} (
                {(nextBlock.end_slot - nextBlock.start_slot) * SLOT_MIN}m)
              </div>
            </div>
            <Menu as="div" className="relative">
              <Menu.Button className="text-zinc-400 hover:text-white">
                <MoreHorizontal size={16} />
              </Menu.Button>
              <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left bg-zinc-800 border border-white/10 rounded-md shadow-lg z-10">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-white/10 text-white" : "text-zinc-300"
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      >
                        Start now
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSnooze}
                        className={`${
                          active ? "bg-white/10 text-white" : "text-zinc-300"
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      >
                        Snooze 10m
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">No upcoming blocks.</div>
        )}
      </div>
      <div>
        <button className="text-zinc-400 hover:text-white">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
