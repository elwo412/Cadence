import { useMemo } from "react";
import usePlanner, { type State } from "@/state/planner";
import { isSameDayISO } from "@/lib/time";
import { Block, Task } from "@/types";

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
    const today = new Set<string>();
    const res: Task[] = [];
    // derive scheduled ids
    for (const b of blocks) {
      if (!isSameDayISO(b.dateISO, dateISO)) continue;
      if (b.kind === "atomic" && b.taskId) today.add(b.taskId);
      if (b.kind === "work") for (const it of b.items ?? []) today.add(it.taskId);
    }
    // pick unscheduled & not done
    for (const t of tasks) if (!t.done && !today.has(t.id)) res.push(t);

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

export const selectTodayTaskIds = (
  tasks: Task[],
  blocks: Block[],
  dateISO: string
): string[] => {
  const ids = new Set<string>();

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // 1. Scheduled tasks
  for (const b of blocks) {
    if (b.dateISO === dateISO) {
      if (b.kind === "atomic" && b.taskId) {
        const task = taskMap.get(b.taskId);
        if (task && !task.done) ids.add(b.taskId);
      } else if (b.kind === "work") {
        for (const it of b.items ?? []) {
          const task = taskMap.get(it.taskId);
          if (task && !task.done) ids.add(it.taskId);
        }
      }
    }
  }

  // 2. Pinned (isToday) and Due tasks
  for (const t of tasks) {
    if (t.done) continue;
    if (t.isToday) {
      ids.add(t.id);
    }
    if (t.due && isSameDayISO(t.due, dateISO)) {
      ids.add(t.id);
    }
  }

  return Array.from(ids).sort();
};

export const useTodayTasks = (dateISO: string): Task[] => {
  const tasks = usePlanner((s: State) => s.tasks);
  const blocks = usePlanner((s: State) => s.blocks);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasks]);

  const todayTaskIds = useMemo(
    () => selectTodayTaskIds(tasks, blocks, dateISO),
    [tasks, blocks, dateISO]
  );

  return useMemo(
    () => todayTaskIds.map((id) => taskMap.get(id)!).filter(Boolean),
    [todayTaskIds, taskMap]
  );
};
