import React, { useMemo } from 'react';
import { useTasks, useBlocks } from '../../hooks/usePlannerStore';
import { DayBlock } from '../../types';
import { SLOT_MIN, getCurrentTime, minsToHHMM } from '../../lib/time';

function kpiChip(label: string, value: string | number) {
    return (
        <div className="text-xs">
            <span className="text-zinc-400">{label}</span>
            <span className="ml-1.5 font-medium text-zinc-200">{value}</span>
        </div>
    );
}

function getNextBlock(blocks: DayBlock[]): DayBlock | null {
    const nowSlot = getCurrentTime().hour * (60 / SLOT_MIN) + getCurrentTime().minute / SLOT_MIN;
    return blocks
        .filter(b => b.start_slot > nowSlot)
        .sort((a, b) => a.start_slot - b.start_slot)[0] || null;
}

export function Header() {
    const tasks = useTasks();
    const blocks = useBlocks();

    const { plannedHours, tasksLeft } = useMemo(() => {
        const plannedMinutes = blocks.reduce((sum, b) => sum + (b.end_slot - b.start_slot) * SLOT_MIN, 0);
        const plannedHours = (plannedMinutes / 60).toFixed(1);

        const todayTaskIds = new Set(blocks.map(b => b.task_id));
        const tasksLeft = tasks.filter(t => !t.done && todayTaskIds.has(t.id)).length;

        return { plannedHours, tasksLeft };
    }, [tasks, blocks]);

    const nextBlock = getNextBlock(blocks);
    const nextTask = nextBlock ? tasks.find(t => t.id === nextBlock.task_id) : null;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="font-medium text-zinc-200">Today · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h1>
                <div className="h-4 w-px bg-white/10" />
                {kpiChip('Planned', `${plannedHours}h`)}
                <div className="h-4 w-px bg-white/10" />
                {kpiChip('Blocks', blocks.length)}
                <div className="h-4 w-px bg-white/10" />
                {kpiChip('Tasks left', tasksLeft)}
            </div>
            
            {nextBlock && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Next:</span>
                    <div className="rounded-lg bg-white/10 px-2 py-1 text-zinc-200">
                        {minsToHHMM(nextBlock.start_slot * SLOT_MIN)} {nextTask?.title}
                    </div>
                </div>
            )}
        </div>
    );
}
