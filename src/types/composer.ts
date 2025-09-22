export type Priority = 1 | 2 | 3;

export interface ParsedTask {
  id?: string;               // assigned on accept
  title: string;             // user-facing, verb-first
  est?: number;              // minutes (5..180)
  tags?: string[];           // lowercase
  priority?: Priority;
}

export interface PlanWithAIResponse {
  assistant_text: string;     // natural language guidance
  proposed_tasks: ParsedTask[]; // new tasks to add
  questions?: string[];       // clarifying questions
}

export interface RefineSuggestion {
  kind: "update" | "split" | "merge";
  targetIds: string[];        // ids from existing tasks
  updates?: Partial<ParsedTask>; // for kind=update
  split?: ParsedTask[];       // for kind=split
  reason?: string;
}

export interface RefineResponse {
  assistant_text: string;
  suggestions: RefineSuggestion[];
}

export interface EnrichResponse {
  tasks: ParsedTask[];        // same titles; only meta fields filled
}
