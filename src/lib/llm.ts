// A mock LLM client.
// In a real app, this would be a separate package.
// For now, we'll just simulate a network request.

import { Task } from "../types";

// Takes a list of tasks and returns a "refined" list.
export async function refineTasks(tasks: Task[]): Promise<Task[]> {
  // Simulate a network request
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate an LLM assist that adds durations & tags, and rephrases titles slightly
  return tasks.map((t) => ({
    ...t,
    title: t.title + " (refined)",
    est_minutes: t.est_minutes || 15,
    tags: [...(t.tags || []), "llm"],
  }));
}
