import { Task } from "@/types";

export function exportTasksToMarkdown(tasks: Task[]): string {
  let markdown = "";

  tasks.forEach((task) => {
    let taskString = `- [${task.done ? "x" : " "}] ${task.title}`;
    if (task.due) {
      taskString += ` (due: ${task.due})`;
    }
    markdown += taskString + "\n";
  });

  return markdown;
}
