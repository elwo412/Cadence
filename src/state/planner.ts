import { create } from "zustand";
import { devtools } from 'zustand/middleware';
import { Block, Task, WorkItem } from "../types";
import { ParsedTask } from "../types/composer";
import { invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// These types represent the data structure coming from the Rust backend
type BackendTask = Omit<Task, 'isToday'> & { is_today: boolean };
type BackendBlock = {
  id: string;
  task_id: string;
  date: string;
  start_slot: number;
  end_slot: number;
};

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
  addBlock: (block: Omit<Block, 'id'>, date: string) => void;
  addAtomicBlock: (block: Omit<Block, 'id' | 'kind'>) => void;
  addWorkItem: (blockId: string, item: WorkItem) => void;
  saveBlocks: (date: string) => void;
  toggleTask: (id: string) => void;
  toggleToday: (id: string) => void;
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
        const backendTasks = await invoke<BackendTask[]>("get_tasks");
        const tasks: Task[] = backendTasks.map(t => ({
          ...t,
          isToday: t.is_today,
        }));
        set({ tasks });
      },
      fetchBlocks: async (date) => {
        const backendBlocks = await invoke<BackendBlock[]>("get_blocks_for_date", { date });
        const frontendBlocks: Block[] = backendBlocks.map(b => ({
          id: b.id,
          taskId: b.task_id,
          dateISO: b.date,
          startMin: b.start_slot * 15,
          lengthMin: (b.end_slot - b.start_slot) * 15,
          kind: 'atomic', 
        }));
        set({ blocks: frontendBlocks });
      },
      addTask: async (task) => {
        const newTask: Task = {
          id: uuidv4(),
          title: task.title,
          done: false,
          isToday: false,
          tags: task.tags || [],
          priority: task.priority || 2,
          est_minutes: task.est || 25,
          createdAt: new Date().toISOString(),
          due: null,
          notes: null,
          project: null,
        };

        const { isToday, ...rest } = newTask;
        const backendTask = { ...rest, is_today: isToday };

        await invoke("add_task", { task: backendTask });
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: async (id, updates) => {
        const originalTask = get().tasks.find((t) => t.id === id);
        if (!originalTask) return;
        const updatedTask = { ...originalTask, ...updates };

        const { isToday, ...rest } = updatedTask;
        const backendTask = { ...rest, is_today: isToday };

        await invoke("update_task", { task: backendTask });
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
      addBlock: (block, date) => {
        const newBlock = { ...block, id: uuidv4() };
        set((state) => ({ blocks: [...state.blocks, newBlock] }));
        get().saveBlocks(date);
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
        console.log("Saving blocks for date:", date);
        if (!date) {
          console.error("`saveBlocks` called without a date!");
          return;
        }
        const blocksToSave = get().blocks
          .filter(b => b.dateISO === date)
          .map(b => ({
            id: b.id,
            task_id: b.taskId,
            date: b.dateISO,
            start_slot: Math.floor(b.startMin / 15),
            end_slot: Math.floor((b.startMin + b.lengthMin) / 15),
          }));

        invoke("save_blocks_for_date", { date: date, blocks: blocksToSave });
      },
      toggleTask: (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          get().updateTask(id, { done: !task.done });
        }
      },
      toggleToday: (id: string) => {
        const tasks = get().tasks;
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        const originalTask = { ...task };
        const updatedTask = { ...task, isToday: !task.isToday };

        // Optimistic update
        set({ tasks: tasks.map((t) => (t.id === id ? updatedTask : t)) });

        // Analytics placeholder
        console.log(`Analytics event: task.pin_today.${updatedTask.isToday ? 'on' : 'off'}`);

        toast.success(
          updatedTask.isToday ? "Task added to Today" : "Task removed from Today",
          {
            action: {
              label: "Undo",
              onClick: () => {
                set({ tasks: tasks.map((t) => (t.id === id ? originalTask : t)) });
                get().updateTask(id, { isToday: originalTask.isToday });
                 console.log(`Analytics event: task.pin_today.${originalTask.isToday ? 'on' : 'off'} (undo)`);
              },
            },
          }
        );

        get().updateTask(id, { isToday: updatedTask.isToday });
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

export default usePlanner;
