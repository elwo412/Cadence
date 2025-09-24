import { useEffect, useState, useMemo } from "react";
import { getBacklogCandidates } from "@/features/tasks/selectors";
import { AnimatePresence, motion } from "framer-motion";
import { useDraggable, useDndMonitor } from "@dnd-kit/core";
import { Task } from "@/types";
import { Checkbox } from "@/components/Checkbox";
import { autoPlace } from "@/features/calendar/schedule";
import usePlanner from "../../state/planner";
import { Pin } from "lucide-react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";

export function TaskCard({ task, selected, onToggleSelect }: { task: Task; selected: boolean, onToggleSelect: () => void; }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'TASK',
      taskId: task.id,
      task: task,
    },
  });
  const toggleToday = usePlanner(s => s.toggleToday);
  let cardRef: HTMLDivElement | null = null;

  const setCombinedRef = (node: HTMLDivElement) => {
    cardRef = node;
    setNodeRef(node);
  };

  useHotkeys('.', () => {
    if (document.activeElement === cardRef) {
      toggleToday(task.id);
    }
  }, { scopes: ['tasks'] });


  return (
    <div
      ref={setCombinedRef}
      {...listeners}
      {...attributes}
      className="flex-shrink-0 w-64 rounded-xl border border-white/10 bg-black/40 hover:bg-black/55 shadow-[0_6px_18px_rgba(0,0,0,0.35)] p-3 flex flex-col gap-2 relative cursor-grab"
    >
      <div className="flex items-start justify-between">
        <span className="text-zinc-200 text-sm">{task.title}</span>
        <div className="flex items-center gap-2">
           <button
            onClick={() => toggleToday(task.id)}
            title={task.isToday ? "Remove from Today" : "Add to Today"}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
           >
            <Pin
              size={14}
              className={cn(
                "transition-colors",
                task.isToday ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
              )}
              fill={task.isToday ? "currentColor" : "none"}
            />
          </button>
          <Checkbox id={task.id} checked={selected} onCheckedChange={onToggleSelect} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>~{task.est_minutes}m</span>
        {task.tags?.map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded-md">{tag}</span>
        ))}
      </div>
    </div>
  )
}

function BeltScroller({ items, expanded, selectedIds, onToggleSelect }: { items: Task[]; expanded: boolean; selectedIds: Set<string>; onToggleSelect: (id: string) => void; }) {
  return (
    <div className="h-full overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={expanded ? 'expanded' : 'collapsed'}
          className={`flex ${expanded ? 'flex-wrap flex-row p-3 gap-3 overflow-y-auto' : 'flex-nowrap p-2 gap-2 overflow-x-hidden'} w-full h-full thin-scroll`}
        >
          {items.map(task => (
            <TaskCard key={task.id} task={task} selected={selectedIds.has(task.id)} onToggleSelect={() => onToggleSelect(task.id)} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const STACKS = ['all', 'due', 'high', 'micro', 'recent', 'pinned'] as const;
type Stack = typeof STACKS[number];

function BeltHeader({ stack, setStack, counts }: { stack: Stack; setStack: (s: Stack) => void; counts: Record<Stack, number> }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-3 pt-2">
      <div className="flex items-center gap-2">
        {STACKS.map(s => (
          <button
            key={s}
            onClick={() => setStack(s)}
            className={`px-2 py-0.5 rounded-md text-xs capitalize ${stack === s ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:bg-white/5'}`}
          >
            {s} <span className="ml-1 text-zinc-500">{counts[s]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BeltFooter({ selectedCount, onAutoPlace }: { selectedCount: number, onAutoPlace: () => void }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-end px-3 pb-2">
      <button
        onClick={onAutoPlace}
        disabled={selectedCount === 0}
        className="px-3 py-1 rounded-lg bg-white/10 text-zinc-200 text-sm disabled:opacity-50 hover:bg-white/20 disabled:cursor-not-allowed"
      >
        Auto-place ({selectedCount})
      </button>
    </div>
  )
}


export function BacklogBelt({ dateISO }: { dateISO: string }) {
  const tasks  = usePlanner(s => s.tasks);
  const blocks = usePlanner(s => s.blocks);
  const all = useMemo(() => getBacklogCandidates(tasks, blocks, dateISO), [tasks, blocks, dateISO]);
  const { enableScope, disableScope } = useHotkeysContext();
  
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [stack, setStack] = useState<Stack>('all');
  const [isDragging, setIsDragging] = useState(false);

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "b") setExpanded(v => !v); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => ({
    all: all.length,
    due: all.filter(t => t.due).length,
    high: all.filter(t => t.priority === 1).length,
    micro: all.filter(t => t.est_minutes <= 15).length,
    recent: all.filter(t => new Date(t.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length,
    pinned: 0, // Pinned not implemented yet
  }), [all]);

  const items = useMemo(() => {
    switch (stack) {
      case 'due': return all.filter(t => t.due);
      case 'high': return all.filter(t => t.priority === 1);
      case 'micro': return all.filter(t => t.est_minutes <= 15);
      case 'recent': return all.filter(t => new Date(t.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
      default: return all;
    }
  }, [all, stack]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAutoPlace = () => {
    autoPlace(Array.from(selectedIds), dateISO);
    setSelectedIds(new Set());
  }

  return (
    <motion.div
      onMouseEnter={() => {
        setExpanded(true);
        enableScope('tasks');
      }}
      onMouseLeave={() => {
        if (!isDragging) {
          setExpanded(false);
          disableScope('tasks');
        }
      }}
      className="mt-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col flex-shrink-0"
      animate={{ height: expanded || isDragging ? 240 : 56 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      role="complementary" aria-label="Backlog belt"
    >
      <BeltHeader stack={stack} setStack={setStack} counts={counts} />
      {expanded && <BeltScroller items={items} expanded={expanded} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />}
      {expanded && <BeltFooter selectedCount={selectedIds.size} onAutoPlace={handleAutoPlace} />}
    </motion.div>
  );
}
