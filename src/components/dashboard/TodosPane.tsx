import React, { useCallback, useMemo } from 'react';
import usePlannerStore, { useTasks, useBlocks, useFocusQueue, useActiveFocus } from '../../hooks/usePlannerStore';
import TaskRow from '../TaskRow';
import { CompactAdd } from '../CompactAdd';

export function TodosPane() {
    const tasks = useTasks();
    const blocks = useBlocks();
    const focusQueue = useFocusQueue();
    const activeFocus = useActiveFocus();
    const toggleFocus = usePlannerStore(s => s.toggleFocus);
    const toggleTask = usePlannerStore(s => s.toggleTask);
    const addTask = usePlannerStore(s => s.addTask);
    
    const scheduledTaskIds = useMemo(() => {
        return new Set(blocks.map(b => b.task_id).filter((id): id is string => id !== null));
    }, [blocks]);

    const todayTasks = tasks.filter(t => !t.done && scheduledTaskIds.has(t.id));

    const inQueue = useCallback((id: string) => {
        return focusQueue.includes(id) || activeFocus.includes(id);
    }, [focusQueue, activeFocus]);

    return (
        <div className="border border-white/10 rounded-3xl bg-white/5 p-4 flex flex-col gap-4 h-full">
            <div className="text-sm font-medium text-zinc-200">Today's Tasks</div>
            <div className="flex-1 overflow-auto pr-1">
                {todayTasks.length > 0 ? (
                    todayTasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task.id)}
                            inQueue={inQueue}
                            onToggleFocus={() => toggleFocus(task.id)}
                        />
                    ))
                ) : (
                    <div className="text-sm text-zinc-500 italic p-2">
                        No tasks scheduled for today. Drag tasks from your backlog or add new ones.
                    </div>
                )}
            </div>
            <CompactAdd
                onAdd={(title) => addTask({ title })}
                placeholder="Add a task to backlog..."
            />
        </div>
    );
}
