
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
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

/**
 * Defines the possible priority levels for a task.
 */
export type TaskPriority = 'Low' | 'Medium' | 'High';

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
  deadline: string; 
  projectId: string;
  storyPoints: number;
  subtasks: Subtask[];
  logs: Log[];
};

/**
 * Represents a single note associated with a project.
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  isCollapsed?: boolean;
};

/**
 * Defines the possible statuses for a project.
 */
export type ProjectStatus = 'In Progress' | 'Backlog' | 'Done' | 'Archived';

/**
 * Represents a single project, which contains tasks and notes.
 */
export type Project = {
  id: string;
  name: string;
  description: string;
  notes: Note[];
  status: ProjectStatus;
};
