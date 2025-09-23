import { ParsedTask } from "./composer";

export interface Session {
  kind: "focus" | "break";
  minutes: number;
  completed: boolean;
  taskIds?: string[];
  at: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  est_minutes: number;
  notes: string | null;
  project: string | null;
  tags: string[] | null;
  created_at: string;
  priority?: number;
}

export interface DayBlock {
  id: string;
  task_id: string | null;
  date: string;
  start_slot: number;
  end_slot: number;
}
