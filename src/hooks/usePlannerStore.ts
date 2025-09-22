import { create } from "zustand";
import { DayBlock, Task } from "../types";
import { ParsedTask } from "../types/composer";
import { invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";

interface PlannerState {
  tasks: Task[];
  blocks: DayBlock[];
  fetchTasks: () => Promise<void>;
  fetchBlocks: (date: string) => Promise<void>;
  addTask: (task: ParsedTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setBlocks: (blocks: DayBlock[] | ((prev: DayBlock[]) => DayBlock[])) => void;
  addBlock: (block: DayBlock) => void;
  saveBlocks: (date: string) => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: [],
  blocks: [],
  fetchTasks: async () => {
    const tasks = await invoke<Task[]>("get_tasks");
    set({ tasks });
  },
  fetchBlocks: async (date) => {
    const blocks = await invoke<DayBlock[]>("get_blocks_for_date", { date });
    set({ blocks });
  },
  addTask: async (task) => {
    const newTask: Task = {
      id: uuidv4(),
      title: task.title,
      done: false,
      tags: task.tags || [],
      priority: task.priority || 2,
      est_minutes: task.est || 25,
      created_at: new Date().toISOString(),
      notes: null,
      project: null,
    };
    await invoke("add_task", { task: newTask });
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
  updateTask: async (id, updates) => {
    const originalTask = get().tasks.find((t) => t.id === id);
    if (!originalTask) return;
    const updatedTask = { ...originalTask, ...updates };

    await invoke("update_task", { task: updatedTask });
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));
  },
  deleteTask: async (id) => {
    await invoke("delete_task", { id });
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
  setBlocks: (blocks) => {
    if (typeof blocks === "function") {
      set((state) => ({ blocks: blocks(state.blocks) }));
    } else {
      set({ blocks });
    }
  },
  addBlock: (block) => {
    set((state) => ({ blocks: [...state.blocks, block] }));
  },
  saveBlocks: (date) => {
    const blocks = get().blocks;
    invoke("save_blocks_for_date", { date, blocks });
  },
}));
