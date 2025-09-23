export type Priority = 1 | 2 | 3;

export type Task = {
  id: string;
  title: string;
  done: boolean;
  est_minutes: number; // minutes
  notes: string | null;
  project: string | null;
  tags: string[] | null;
  priority: Priority;
  createdAt: string; // ISO string
  due: string | null; // ISO string
};

export type Session = {
  at: string;
  kind: "focus" | "break";
  minutes: number;
  completed: boolean;
  taskIds?: string[];
};

export type WorkItem = {
  taskId: string;
  est_minutes: number; // minutes
};

export type Block = {
  id: string;
  dateISO: string;
  startMin: number; // minutes from midnight
  lengthMin: number;
  kind: "atomic" | "work";
  taskId?: string; // for atomic blocks
  items?: WorkItem[]; // for work blocks
};
