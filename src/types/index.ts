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
