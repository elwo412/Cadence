import { useMemo } from "react";
import usePlanner, { type State } from "@/state/planner";
import { isSameDayISO } from "@/lib/time";
import { Block, Task } from "@/types";

export type TaskOrigin = "scheduled" | "pinned" | "due";

export const useTodayTaskIdSet = (dateISO: string) => {
  const blocks = usePlanner((s: State) => s.blocks);
  return useMemo(() => {
    const ids = new Set<string>();
    for (const b of blocks) {
      if (!isSameDayISO(b.dateISO, dateISO)) continue;
      if (b.kind === "atomic" && b.taskId) ids.add(b.taskId);
      if (b.kind === "work") for (const it of b.items ?? []) ids.add(it.taskId);
    }
    return ids;
  }, [blocks, dateISO]);
};

export const getBacklogCandidates = (tasks: Task[], blocks: Block[], dateISO: string): Task[] => {
    const todayTaskIds = new Set(selectTodayTasks(tasks, blocks, dateISO).map(t => t.id));

    const res: Task[] = [];
    // pick unscheduled & not done
    for (const t of tasks) if (!t.done && !todayTaskIds.has(t.id)) res.push(t);

    // score: due soon > high priority > micro > recent
    const score = (t: Task) =>
      (t.due ? -new Date(t.due).getTime() : 0) +
      (t.priority ? (4 - t.priority) * 1e10 : 0) +
      ((t.est_minutes ?? 0) <= 15 ? 5e9 : 0) +
      (t.createdAt ? -new Date(t.createdAt).getTime() * 0.1 : 0);

    return res.sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.id.localeCompare(b.id); // Stable sort fallback
    });
}

export const selectTodayTasks = (
  tasks: Task[],
  blocks: Block[],
  dateISO: string
): { id: string; origins: TaskOrigin[] }[] => {
  const todayTasks = new Map<string, Set<TaskOrigin>>();

  const getOrigins = (taskId: string): Set<TaskOrigin> => {
    if (!todayTasks.has(taskId)) {
      todayTasks.set(taskId, new Set());
    }
    return todayTasks.get(taskId)!;
  };

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // 1. Scheduled tasks
  for (const b of blocks) {
    if (b.dateISO === dateISO) {
      if (b.kind === "atomic" && b.taskId) {
        const task = taskMap.get(b.taskId);
        if (task && !task.done) getOrigins(b.taskId).add("scheduled");
      } else if (b.kind === "work") {
        for (const it of b.items ?? []) {
          const task = taskMap.get(it.taskId);
          if (task && !task.done) getOrigins(it.taskId).add("scheduled");
        }
      }
    }
  }

  // 2. Pinned (isToday) and Due tasks
  for (const t of tasks) {
    if (t.done) continue;
    if (t.isToday) {
      getOrigins(t.id).add("pinned");
    }
    if (t.due && isSameDayISO(t.due, dateISO)) {
      getOrigins(t.id).add("due");
    }
  }

  const result = Array.from(todayTasks.entries()).map(([id, origins]) => ({
    id,
    origins: Array.from(origins),
  }));

  return result.sort((a, b) => a.id.localeCompare(b.id));
};

export const useTodayTasks = (dateISO: string): (Task & { origins: TaskOrigin[] })[] => {
  const tasks = usePlanner((s: State) => s.tasks);
  const blocks = usePlanner((s: State) => s.blocks);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasks]);

  const todayTasks = useMemo(
    () => selectTodayTasks(tasks, blocks, dateISO),
    [tasks, blocks, dateISO]
  );

  return useMemo(
    () =>
      todayTasks
        .map(({ id, origins }) => {
          const task = taskMap.get(id);
          return task ? { ...task, origins } : null;
        })
        .filter(Boolean) as (Task & { origins: TaskOrigin[] })[],
    [todayTasks, taskMap]
  );
};
