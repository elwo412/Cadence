// A mock LLM client.
// In a real app, this would be a separate package.
// For now, we'll just simulate a network request.

import {
  EnrichResponse,
  ParsedTask,
  PlanWithAIResponse,
  RefineResponse,
} from "../types/composer";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";

// A placeholder for a generic API call helper
async function postJSON<T>(command: string, payload: Record<string, unknown>): Promise<T> {
  // In a real web app, this would be a fetch call.
  // For Tauri, we'll invoke a Rust command.
  try {
    const result = await invoke(command, payload);
    return result as T;
  } catch (error) {
    if (typeof error === "string" && error.includes("API key not found")) {
      toast.error("OpenAI API key not set. Please add it in Settings.");
    }
    console.error(`Error invoking command '${command}':`, error);
    // In a real app, you'd want more robust error handling
    throw new Error("Failed to communicate with the backend.");
  }
}

export async function llmEnrich(tasks: ParsedTask[]): Promise<EnrichResponse> {
  const sys = `You enrich tasks with metadata only. NEVER change titles. 
Return JSON: { "tasks": [{ "title": SAME_AS_INPUT, "est": minutes (5..180), "tags": ["kebab"], "priority": 1|2|3 }] }`;
  return postJSON("llm_enrich", { tasks, sysPrompt: sys });
}

export async function llmPlanWithAI(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  constraints: Record<string, unknown>
): Promise<PlanWithAIResponse> {
  const sys = `You are a planning copilot. Break goals into small, actionable tasks. Each task must have a verb-first title and an estimated duration in minutes (est) between 5 and 90.
Respect user's working hours and the following constraints: ${JSON.stringify(
    constraints
  )}.
Return JSON following this exact schema: { "assistant_text": "...", "proposed_tasks": [{ "title": "A task title", "est": 30 }], "questions": ["..."] }`;
  return postJSON("llm_plan", { messages, sysPrompt: sys });
}

export async function llmRefine(
  existing: ParsedTask[],
  notes?: string
): Promise<RefineResponse> {
  const sys = `Given current tasks, propose improvements. Prefer updates to metadata; keep titles unless clarity improves.
Return JSON: { "assistant_text": "...", "suggestions": [ { "kind": "update"|"split"|"merge", "targetIds": ["..."], "updates": {...}, "split": [...], "reason": "..." } ] }`;
  return postJSON("llm_refine", { existing, notes, sysPrompt: sys });
}
