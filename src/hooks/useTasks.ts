import { useState } from "react";
import { Task } from "../types";
import { uuid } from "../lib/utils";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: uuid(),
      title: "Write daily plan",
      est: 10,
      tags: ["ritual"],
      done: false,
    },
    {
      id: uuid(),
      title: "Deep work block",
      est: 50,
      tags: ["focus", "pomodoro"],
      done: false,
    },
  ]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((t) => [
      { id: uuid(), title: newTask.trim(), tags: [], done: false },
      ...t,
    ]);
    setNewTask("");
  };

  const toggleTask = (id: string) =>
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const deleteTask = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const applyLLM = async () => {
    // Simulate an LLM assist that adds durations & tags, and rephrases titles slightly
    await new Promise((r) => setTimeout(r, 750));
    setTasks((ts) =>
      ts.map((t) => ({
        ...t,
        title: t.title.replace(/\b(Write|Do|Work on)\b/i, "Plan"),
        est: t.est ?? (t.title.toLowerCase().includes("deep") ? 50 : 25),
        tags: Array.from(
          new Set([
            ...(t.tags || []),
            ...(t.title.toLowerCase().includes("deep")
              ? ["deepwork"]
              : ["ritual"]),
          ])
        ),
      }))
    );
  };

  return {
    tasks,
    newTask,
    setNewTask,
    addTask,
    toggleTask,
    deleteTask,
    applyLLM,
  };
};
