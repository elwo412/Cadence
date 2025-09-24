import { shallow } from "zustand/shallow";
import { usePlanner } from "@/state/planner";
import { isSameDayISO } from "@/lib/time";
import { Task, Block } from "@/types";

export const useTodayTaskIdSet = (dateISO: string) =>
  usePlanner(s => {
    const ids = new Set<string>();
    for (const b of s.blocks) {
      if (!isSameDayISO(b.dateISO, dateISO)) continue;
      if (b.kind === "atomic" && b.taskId) ids.add(b.taskId);
      if (b.kind === "work") for (const it of b.items ?? []) ids.add(it.taskId);
    }
    return ids;
  }, shallow);

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
