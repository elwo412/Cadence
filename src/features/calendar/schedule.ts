import { usePlanner } from "@/state/planner";
import { Block } from "@/types";
import { Task } from "@/types";

function workRemaining(block: Block, store: ReturnType<typeof usePlanner.getState>) {
    if (block.kind !== 'work' || !block.items) return 0;
    const used = block.items.reduce((sum, item) => sum + item.est_minutes, 0);
    return block.lengthMin - used;
}

function findNextGapThatFits(blocks: Block[], dateISO: string, est: number, dayStartMin = 9 * 60, dayEndMin = 17 * 60) {
    const todayBlocks = blocks
        .filter(b => b.dateISO === dateISO)
        .sort((a, b) => a.startMin - b.startMin);

    let lastEnd = dayStartMin;

    for (const block of todayBlocks) {
        if (block.startMin - lastEnd >= est) {
            return { start: lastEnd };
        }
        lastEnd = block.startMin + block.lengthMin;
    }

    if (dayEndMin - lastEnd >= est) {
        return { start: lastEnd };
    }

    return null;
}


export function scheduleNextFreeSlot(taskId: string, dateISO: string) {
    const store = usePlanner.getState();
    const est = Math.max(5, Math.min(180, Math.round((store.tasks.find(t=>t.id===taskId)?.est_minutes ?? 30)/5)*5));
    // 1) try to fill work blocks if est<=15
    if (est <= 15) {
      const work = store.blocks.filter(b => b.kind === 'work' && b.dateISO === dateISO);
      for (const b of work) if (workRemaining(b, store) >= est) {
        store.addWorkItem(b.id, { taskId, est_minutes: est });
        return;
      }
    }
    // 2) find next available atomic slot
    const slot = findNextGapThatFits(store.blocks, dateISO, est);
    if (!slot) {
        console.warn("No free slot found for task", taskId);
        return;
    }
    store.addAtomicBlock({ taskId, dateISO, startMin: slot.start, lengthMin: est });
}

export function calculateNextBlock(taskId: string, dateISO:string, tasks: Task[], blocks: Block[]): Block | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  const est = Math.max(5, Math.min(180, Math.round((task.est_minutes ?? 30) / 5) * 5));
  const slot = findNextGapThatFits(blocks, dateISO, est);
  if (!slot) return null;

  return {
    id: 'preview-block',
    dateISO,
    startMin: slot.start,
    lengthMin: est,
    kind: 'atomic',
    taskId,
  };
}

export function autoPlace(taskIds: string[], dateISO: string) {
    const store = usePlanner.getState();
    const tasks = store.tasks.filter(t => taskIds.includes(t.id)).sort((a, b) => b.est_minutes - a.est_minutes);
    
    for (const task of tasks) {
        scheduleNextFreeSlot(task.id, dateISO);
    }
  }
