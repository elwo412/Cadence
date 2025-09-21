import { useState } from "react";
import { Task } from "../types";
import { uuid } from "../lib/utils";
import { ParsedTask } from "../lib/parsing";
import { refineTasks } from "../lib/llm";

const roundTo = (n: number, to: number) => Math.round(n / to) * to;

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastTasks, setLastTasks] = useState<Task[]>([]);

  const addTask = (parsedTasks: ParsedTask[]) => {
    setLastTasks(tasks);
    const newTasks: Task[] = [];
    for (const p of parsedTasks) {
      for (let i = 0; i < (p.count ?? 1); i++) {
        newTasks.push({
          id: uuid(),
          title: p.title,
          tags: p.tags,
          done: false,
          est: p.est ? roundTo(p.est, 5) : undefined,
        });
      }
    }
    setTasks((t) => [...newTasks, ...t]);
  };

  const undo = () => {
    setTasks(lastTasks);
  };

  const toggleTask = (id: string) =>
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const deleteTask = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const applyLLM = async () => {
    const refined = await refineTasks(tasks);
    setTasks(refined);
  };

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    applyLLM,
    undo,
  };
};
