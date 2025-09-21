/**
 * @fileoverview Defines the core data types used throughout the TaskPilot application.
 * This includes types for projects, tasks, subtasks, notes, and logs.
 */

/**
 * @typedef {object} Subtask
 * Represents a single subtask within a parent task.
 * @property {string} id - The unique identifier for the subtask.
 * @property {string} title - The title or description of the subtask.
 * @property {boolean} isCompleted - The completion status of the subtask.
 * @property {number} storyPoints - The estimated effort for the subtask.
 */
export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
  storyPoints: number;
};

/**
 * @typedef {'To Do' | 'In Progress' | 'Done'} TaskStatus
 * Defines the possible statuses for a task.
 */
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

/**
 * @typedef {'Low' | 'Medium' | 'High'} TaskPriority
 * Defines the possible priority levels for a task.
 */
export type TaskPriority = 'Low' | 'Medium' | 'High';

/**
 * @typedef {object} Log
 * Represents a single work log entry for a task.
 * @property {string} id - The unique identifier for the log entry.
 * @property {string} content - The text content of the log entry.
 * @property {string} createdAt - The ISO 8601 timestamp when the log was created.
 */
export type Log = {
  id: string;
  content: string;
  createdAt: string; 
};

/**
 * @typedef {object} Task
 * Represents a single task, which belongs to a project.
 * @property {string} id - The unique identifier for the task.
 * @property {string} title - The title of the task.
 * @property {string} description - A detailed description of the task.
 * @property {TaskStatus} status - The current status of the task.
 * @property {TaskPriority} priority - The priority level of the task.
 * @property {string} [deadline] - The optional due date for the task in ISO 8601 format.
 * @property {string} projectId - The ID of the project this task belongs to.
 * @property {number} storyPoints - The total estimated effort for the task, calculated from its subtasks.
 * @property {Subtask[]} subtasks - An array of subtasks associated with this task.
 * @property {Log[]} logs - An array of work logs associated with this task.
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
};

/**
 * @typedef {object} Note
 * Represents a single note associated with a project. Notes can be nested.
 * @property {string} id - The unique identifier for the note.
 * @property {string} title - The title of the note.
 * @property {string} content - The content of the note, typically in Markdown or HTML format.
 * @property {string} [parentId] - The optional ID of the parent note for nesting.
 * @property {boolean} [isCollapsed] - An optional flag to indicate if the note is collapsed in a tree view.
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  isCollapsed?: boolean;
};

/**
 * @typedef {'In Progress' | 'Backlog' | 'Done' | 'Archived'} ProjectStatus
 * Defines the possible statuses for a project.
 */
export type ProjectStatus = 'In Progress' | 'Backlog' | 'Done' | 'Archived';

/**
 * @typedef {object} Project
 * Represents a single project, which contains tasks and notes.
 * @property {string} id - The unique identifier for the project.
 * @property {string} name - The name of the project.
 * @property {string} description - A brief description of the project.
 * @property {Note[]} notes - An array of notes associated with this project.
 * @property {ProjectStatus} status - The current status of the project.
 */
export type Project = {
  id: string;
  name: string;
  description: string;
  notes: Note[];
  status: ProjectStatus;
};
