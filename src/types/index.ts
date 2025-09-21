export interface Task {
  id: string;
  title: string;
  est?: number;
  tags: string[];
  done?: boolean;
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
  taskId: string; // bind to Task
  startMin: number; // minutes from midnight
  lengthMin: number; // duration in minutes (multiple of SLOT_MIN)
}
