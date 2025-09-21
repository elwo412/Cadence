import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Task } from "../types";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    const fetchedTasks = await invoke<Task[]>("get_tasks");
    setTasks(fetchedTasks);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (task: Omit<Task, "id" | "done">) => {
    const newTask = {
      ...task,
      id: crypto.randomUUID(),
      done: false,
    };
    await invoke("add_task", { task: newTask });
    await fetchTasks();
  };

  const updateTask = async (task: Task) => {
    await invoke("update_task", { task });
    await fetchTasks();
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      await invoke("update_task", { task: { ...task, done: !task.done } });
      await fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    await invoke("delete_task", { id });
    await fetchTasks();
  };

  return {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
};
