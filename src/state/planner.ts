import { create } from "zustand";
import { devtools } from 'zustand/middleware';
import { Block, Task, WorkItem } from "../types";
import { ParsedTask } from "../types/composer";
import { invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";
import { todayISO } from "@/lib/utils";

export type State = {
  tasks: Task[];
  blocks: Block[];
  focusQueue: string[];
  activeFocus: string[];
  previewBlock: Block | null;
  isHoveringMiniDayRail: boolean;
}

type Actions = {
  fetchTasks: () => Promise<void>;
  fetchBlocks: (date: string) => Promise<void>;
  addTask: (task: ParsedTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setBlocks: (blocks: Block[] | ((prev: Block[]) => Block[])) => void;
  addBlock: (block: Omit<Block, 'id'>) => void;
  addAtomicBlock: (block: Omit<Block, 'id' | 'kind'>) => void;
  addWorkItem: (blockId: string, item: WorkItem) => void;
  saveBlocks: (date: string) => void;
  toggleTask: (id: string) => void;
  toggleFocus: (id: string) => void;
  startFocusSession: () => void;
  clearFocusQueue: () => void;
  endFocusSession: () => void;
  setPreviewBlock: (block: Block | null) => void;
  setIsHoveringMiniDayRail: (isHovering: boolean) => void;
}

const usePlanner = create<State & Actions>()(
  devtools(
    (set, get) => ({
      tasks: [],
      blocks: [],
      focusQueue: [],
      activeFocus: [],
      previewBlock: null,
      isHoveringMiniDayRail: false,
      fetchTasks: async () => {
        // This will need updating when backend types change
        const tasks = await invoke<Task[]>("get_tasks");
        set({ tasks });
      },
      fetchBlocks: async (date) => {
        // This will need updating when backend types change
        const blocks = await invoke<Block[]>("get_blocks_for_date", { date });
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
          createdAt: new Date().toISOString(),
          due: null,
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
        const newBlock = { ...block, id: uuidv4() };
        set((state) => ({ blocks: [...state.blocks, newBlock] }));
        get().saveBlocks(todayISO());
      },
      addAtomicBlock: (block) => {
        const newBlock: Block = {
          ...block,
          id: uuidv4(),
          kind: 'atomic',
        };
        set((state) => ({ blocks: [...state.blocks, newBlock] }));
      },
      addWorkItem: (blockId, item) => {
        set((state) => ({
          blocks: state.blocks.map(b => {
            if (b.id === blockId && b.kind === 'work') {
              return {
                ...b,
                items: [...(b.items || []), item],
              };
            }
            return b;
          }),
        }));
      },
      saveBlocks: (date) => {
        const blocks = get().blocks;
        invoke("save_blocks_for_date", { date, blocks });
      },
      toggleTask: (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          get().updateTask(id, { done: !task.done });
        }
      },
      toggleFocus: (id) => {
        set((state) => ({
          focusQueue: state.focusQueue.includes(id)
            ? state.focusQueue.filter((taskId) => taskId !== id)
            : [...state.focusQueue, id],
        }));
      },
      startFocusSession: () => {
        set((state) => ({
          activeFocus: state.focusQueue,
          focusQueue: [],
        }));
      },
      clearFocusQueue: () => {
        set({ focusQueue: [] });
      },
      endFocusSession: () => {
        set({ activeFocus: [] });
      },
      setPreviewBlock: (block) => {
        set({ previewBlock: block });
      },
      setIsHoveringMiniDayRail: (isHovering) => {
        set({ isHoveringMiniDayRail: isHovering });
      }
    }),
    { name: 'planner-store' }
  )
);

export { usePlanner };
