import type { QuickTask, Task } from "@/lib/types";

/**
 * Convert a quick task into a full task shape for shared calculations.
 * Story points are mapped from quick-task points and subtasks are empty.
 */
export function quickTaskToTask(quickTask: QuickTask): Task {
  return {
    id: quickTask.id,
    title: quickTask.title,
    description: quickTask.description,
    status: quickTask.status,
    priority: quickTask.priority,
    deadline: undefined,
    projectId: quickTask.projectId,
    storyPoints: quickTask.points,
    subtasks: [],
    logs: quickTask.logs,
    link: quickTask.link,
  };
}
