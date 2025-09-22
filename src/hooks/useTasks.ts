import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { v4 as uuidv4 } from "uuid";
import { ParsedTask } from "../types/composer";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    invoke("get_tasks").then((res) => setTasks(res as Task[]));
  }, []);

  const addTask = (task: ParsedTask) => {
    const newTask: Task = {
      id: uuidv4(),
      title: task.title,
      done: false,
      tags: task.tags || [],
      priority: task.priority || 2,
      est_minutes: task.est || 25, // Default to 25 mins
      created_at: new Date().toISOString(),
    };
    invoke("add_task", { task: newTask }).then(() => {
      setTasks((prev) => [...prev, newTask]);
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const originalTask = tasks.find((t) => t.id === id);
    if (!originalTask) return;

    const updatedTask = { ...originalTask, ...updates };

    invoke("update_task", { task: updatedTask }).then(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updatedTask : t))
      );
    });
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      await invoke("update_task", { task: { ...task, done: !task.done } });
      await fetchTasks();
    }
  };

  const deleteTask = (id: string) => {
    invoke("delete_task", { id }).then(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return { tasks, addTask, updateTask, deleteTask };
}
