import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Task } from "../types";
import { v4 as uuidv4 } from "uuid";
import { ParsedTask } from "../lib/parsing";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = () => {
    invoke("get_tasks").then((res) => setTasks(res as Task[]));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = (task: ParsedTask) => {
    const newTask: Omit<Task, 'done'> = {
      id: uuidv4(),
      title: task.title,
      tags: task.tags || null,
      priority: task.priority,
      est_minutes: task.est || 25,
      notes: null,
      project: null,
    };
    invoke("add_task", { task: { ...newTask, done: false } }).then(() => {
      loadTasks();
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const originalTask = tasks.find((t) => t.id === id);
    if (!originalTask) return;

    const updatedTask = { ...originalTask, ...updates };

    invoke("update_task", { task: updatedTask }).then(() => {
      loadTasks();
    });
  };

  const deleteTask = (id: string) => {
    invoke("delete_task", { id }).then(() => {
      loadTasks();
    });
  };

  return { tasks, addTask, updateTask, deleteTask, loadTasks };
}
