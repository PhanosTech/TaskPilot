/**
 * @fileoverview Defines the core data types used throughout the TaskPilot application.
 * This includes types for projects, tasks, subtasks, notes, and logs.
 */

/**
 * Represents a single subtask within a parent task.
 */
export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
  storyPoints: number;
};

/**
 * Defines the possible statuses for a task.
 */
export type TaskStatus = "To Do" | "In Progress" | "Done";

/**
 * Defines the possible priority levels for a task.
 */
export type TaskPriority = "Low" | "Medium" | "High";

/**
 * Represents a single work log entry for a task.
 */
export type Log = {
  id: string;
  content: string;
  createdAt: string;
};

/**
 * Represents a single task, which belongs to a project.
 */
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  projectId: string;
  storyPoints: number;
  subtasks: Subtask[];
  logs: Log[];
  link?: string;
};

/**
 * Represents a single note associated with a project.
 *
 * `isMain` (optional) indicates whether this note is the project's primary
 * quick-summary note. When present and true, UIs can render it in prominent
 * places (for example below the tasks list) as a short read-only summary.
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  isCollapsed?: boolean;
  isMain?: boolean;
};

/**
 * Defines the possible statuses for a project.
 */
export type ProjectStatus = "In Progress" | "Backlog" | "Done" | "Archived";

/**
 * Represents a category for grouping projects.
 */
export type ProjectCategory = {
  id: string;
  name: string;
  color: string; // Hex color string
};

/**
 * Represents a single project, which contains tasks and notes.
 */
export type Project = {
  id: string;
  name: string;
  description: string;
  notes: Note[];
  status: ProjectStatus;
  priority: number;
  /**
   * Legacy single category field (kept for backward compatibility).
   * New code should prefer `categoryIds` for multi-category support.
   */
  categoryId?: string;
  /**
   * Multiple category support: a project can belong to zero or more categories.
   * Each entry is the `id` of a ProjectCategory.
   */
  categoryIds?: string[];
};
