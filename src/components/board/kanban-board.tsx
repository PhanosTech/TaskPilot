
"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";

const statuses: TaskStatus[] = ["To Do", "In Progress", "Done"];

/**
 * @interface KanbanBoardProps
 * Props for the KanbanBoard component.
 */
interface KanbanBoardProps {
  /** The array of tasks to display on the board. */
  tasks: Task[];
  /** Callback function to handle changing a task's status. */
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  /** Callback function to handle the creation of a new task. */
  onCreateTask: (data: Omit<Task, 'id' | 'logs'>) => void;
  /** Callback function when a task card is selected, usually to view details. */
  onTaskSelect: (task: Task) => void;
  /** The ID of the currently selected project, or 'all'. */
  selectedProjectId: string;
}

/**
 * @component KanbanBoard
 * The main container for the Kanban view. It renders columns for each task status
 * and distributes the tasks among them.
 * @param {KanbanBoardProps} props - The component props.
 */
export function KanbanBoard({ tasks, onTaskStatusChange, onCreateTask, onTaskSelect, selectedProjectId }: KanbanBoardProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      {statuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          onTaskStatusChange={onTaskStatusChange}
          onCreateTask={onCreateTask}
          onTaskSelect={onTaskSelect}
          selectedProjectId={selectedProjectId}
        />
      ))}
    </div>
  );
}
