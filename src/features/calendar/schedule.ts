import { usePlanner } from "@/state/planner";
import { Block } from "@/types";

function workRemaining(block: Block, store = usePlanner.getState()): number {
    if (block.kind !== 'work' || !block.items) return 0;
    const used = block.items.reduce((sum, item) => sum + item.est, 0);
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


export function scheduleNextFreeSlot(taskId: string, dateISO: string, store = usePlanner.getState()) {
    const est = Math.max(5, Math.min(180, Math.round((store.tasks.find(t=>t.id===taskId)?.est ?? 30)/5)*5));
    // 1) try to fill work blocks if est<=15
    if (est <= 15) {
      const work = store.blocks.filter(b => b.dateISO===dateISO && b.kind==='work')
        .sort((a,b)=>a.startMin-b.startMin);
      for (const b of work) if (workRemaining(b, store) >= est) {
        store.addWorkItem(b.id, { taskId, est }); 
        return { kind:'work', blockId:b.id };
      }
    }
    // 2) compute free gaps & place atomic block
    const slot = findNextGapThatFits(store.blocks, dateISO, est);
    if (!slot) {
        console.log("No slot found");
        return null;
    }
    store.addAtomicBlock({ taskId, dateISO, startMin: slot.start, lengthMin: est });
    return { kind:'atomic' };
  }
  
  export function autoPlace(taskIds: string[], dateISO: string) {
    const store = usePlanner.getState();
    const tasks = store.tasks.filter(t => taskIds.includes(t.id)).sort((a, b) => b.est - a.est);
    
    for (const task of tasks) {
        scheduleNextFreeSlot(task.id, dateISO);
    }
    console.log(`Auto-placed ${taskIds.length} tasks on ${dateISO}`);
  }
