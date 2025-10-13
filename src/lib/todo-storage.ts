/**
 * Shared types and defaults for personal todo storage.
 * These are deliberately kept free of React/DOM dependencies so they can be
 * safely imported in both client and server modules.
 */

export type TodoStatus = "backlog" | "active";

export type TodoCategory = {
  id: string;
  name: string;
  color: string;
};

export type TodoLog = {
  id: string;
  content: string;
  createdAt: number;
};

export type TodoItem = {
  id: string;
  text: string;
  categoryId: string;
  status: TodoStatus;
  isDone: boolean;
  createdAt: number;
  notes: string;
  logs: TodoLog[];
};

export type TodoState = {
  categories: TodoCategory[];
  todos: TodoItem[];
  activeOrder: string[];
};

export const initialTodoState: TodoState = {
  categories: [],
  todos: [],
  activeOrder: [],
};
