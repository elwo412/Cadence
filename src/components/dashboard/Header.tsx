import React, { useMemo } from 'react';
import { usePlanner } from '@/state/planner';
import { Block } from '@/types';
import { getCurrentTime, minsToHHMM } from '@/lib/time';

function kpiChip(label: string, value: string | number) {
    return (
        <div className="text-xs">
            <span className="text-zinc-400">{label}</span>
            <span className="ml-1.5 font-medium text-zinc-200">{value}</span>
        </div>
    );
}

function getNextBlock(blocks: Block[]): Block | null {
    const nowMin = getCurrentTime().hour * 60 + getCurrentTime().minute;
    return blocks
        .filter(b => b.startMin > nowMin)
        .sort((a, b) => a.startMin - b.startMin)[0] || null;
}

export function Header() {
    const tasks = usePlanner(s => s.tasks);
    const blocks = usePlanner(s => s.blocks);

    const { plannedHours, tasksLeft } = useMemo(() => {
        const plannedMinutes = blocks.reduce((sum, b) => sum + b.lengthMin, 0);
        const plannedHours = (plannedMinutes / 60).toFixed(1);

        const todayTaskIds = new Set(blocks.map(b => b.taskId));
        const tasksLeft = tasks.filter(t => !t.done && todayTaskIds.has(t.id)).length;

        return { plannedHours, tasksLeft };
    }, [tasks, blocks]);

    const nextBlock = getNextBlock(blocks);
    const nextTask = nextBlock ? tasks.find(t => t.id === nextBlock.taskId) : null;

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
                        {minsToHHMM(nextBlock.startMin)} {nextTask?.title}
                    </div>
                </div>
            )}
        </div>
    );
}
