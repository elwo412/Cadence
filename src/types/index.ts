export type Priority = 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  done: boolean;
  est_minutes: number;
  notes: string | null;
  project: string | null;
  tags: string[] | null;
  priority?: Priority;
}
export interface Session {
  at: string;
  kind: "focus" | "break";
  minutes: number;
  completed: boolean;
  taskIds?: string[];
}
export interface DayBlock {
  id: string;
  task_id: string | null;
  date: string;
  start_slot: number;
  end_slot: number;
}
