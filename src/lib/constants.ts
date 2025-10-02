/**
 * Centralized application constants
 *
 * Put shared defaults and ordering maps here so the app uses a single source of truth.
 * Update values here whenever you want to change global behavior (e.g. what numeric
 * priority means, default task priority, etc.).
 */

import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

/**
 * Default numeric priority assigned to newly created projects when no priority is provided.
 * Higher numeric value = more important.
 */
export const DEFAULT_PROJECT_PRIORITY = 4;

/**
 * Default task priority for newly created tasks when no explicit priority is provided.
 */
export const DEFAULT_TASK_PRIORITY: TaskPriority = "Low";

/**
 * Default number of days in the future to set as a task's default deadline.
 * Used by task creation forms to prefill a sensible due date.
 */
export const DEFAULT_DEADLINE_OFFSET_DAYS = 4;

/**
 * Priority ordering helper.
 * Lower numeric value here indicates higher task priority when comparing (i.e. 0 == highest).
 * Use this mapping when sorting tasks by their `priority` field.
 */
export const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/**
 * Project status ordering used in project lists (primary sorting by status).
 * Put the statuses in the order you want them displayed.
 */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "In Progress",
  "Backlog",
  "Done",
  "Archived",
];

/**
 * Task statuses (useful when you need an ordered list of statuses for UI like Kanban).
 * Keeping this export here makes it easier to import in a single place when building UI.
 */
export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Done"];
