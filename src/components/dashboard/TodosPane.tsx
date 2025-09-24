import { useCallback } from 'react';
import usePlanner from "@/state/planner";
import TaskRow from '@/components/TaskRow';
import { CompactAdd } from '@/components/CompactAdd';
import { useTodayTasks } from '@/features/tasks/selectors';

export function TodosPane({ dateISO }: { dateISO: string }) {
    const focusQueue = usePlanner(s => s.focusQueue);
    const activeFocus = usePlanner(s => s.activeFocus);
    const toggleFocus = usePlanner(s => s.toggleFocus);
    const toggleTask = usePlanner(s => s.toggleTask);
    const addTask = usePlanner(s => s.addTask);
    const todayTasks = useTodayTasks(dateISO);
    
    const inQueue = useCallback((id: string) => {
        return focusQueue.includes(id) || activeFocus.includes(id);
    }, [focusQueue, activeFocus]);

    return (
        <div className="border border-white/10 rounded-3xl bg-white/5 p-4 flex flex-col gap-4 h-full">
            <div className="text-sm font-medium text-zinc-200">Today's Tasks</div>
            <div className="flex-1 overflow-auto pr-1 min-h-0">
                {todayTasks.length > 0 ? (
                    todayTasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task.id)}
                            inQueue={inQueue}
                            onToggleFocus={() => toggleFocus(task.id)}
                            origins={task.origins}
                        />
                    ))
                ) : (
                    <div className="text-sm text-zinc-500 italic p-2">
                        Pin, set due, or schedule tasks to see them here.
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
