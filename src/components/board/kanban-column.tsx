"use client";

import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "../tasks/create-task-dialog";
import { useState, useContext, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DataContext } from "@/context/data-context";
import {
  TASK_PRIORITY_ORDER,
  DEFAULT_PROJECT_PRIORITY,
  DEFAULT_DEADLINE_OFFSET_DAYS,
  PROJECT_STATUS_ORDER,
} from "@/lib/constants";

// Use centralized constants for ordering and defaults.
// TASK_PRIORITY_ORDER and DEFAULT_PROJECT_PRIORITY are imported from "@/lib/constants".
/**
 * @interface KanbanColumnProps
 * Props for the KanbanColumn component.
 */
interface KanbanColumnProps {
  /** The status this column represents (e.g., "To Do"). */
  status: TaskStatus;
  /** The array of tasks to display in this column. */
  tasks: Task[];
  /** Callback to handle changing a task's status (e.g., when dropped). */
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  /** Callback to handle the creation of a new task in this column. */
  onCreateTask: (data: Omit<Task, "id" | "logs" | "storyPoints">) => void;
  /** Callback when a task card is selected. */
  onTaskSelect: (task: Task) => void;
  /** The currently selected project ID, or 'all'. */
  selectedProjectId: string;
}

/**
 * @component KanbanColumn
 * Represents a single column in the Kanban board (e.g., "To Do", "In Progress").
 * It displays tasks for that status and handles drag-and-drop operations.
 * @param {KanbanColumnProps} props - The component props.
 */
export function KanbanColumn({
  status,
  tasks,
  onTaskStatusChange,
  onCreateTask,
  onTaskSelect,
  selectedProjectId,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { projects, categories } = useContext(DataContext);

  // A task can only be created if a specific project is selected, not "all".
  const canCreateTask = selectedProjectId !== "all";

  const sortedTasks = useMemo(() => {
    const projectPriorityMap = new Map(projects.map((p) => [p.id, p.priority]));
    return [...tasks].sort((a, b) => {
      const projectPriorityA = projectPriorityMap.get(a.projectId) ?? 4;
      const projectPriorityB = projectPriorityMap.get(b.projectId) ?? 4;

      // Sort by project priority so higher-priority projects appear first.
      // Use descending numeric order for project priority.
      if (projectPriorityA !== projectPriorityB) {
        return projectPriorityB - projectPriorityA;
      }

      // For tasks within the same project priority, sort by task priority (High -> Low).
      return TASK_PRIORITY_ORDER[a.priority] - TASK_PRIORITY_ORDER[b.priority];
    });
  }, [tasks, projects]);

  /**
   * @function handleDragOver
   * Prevents the default drag behavior and sets the drag-over state.
   * @param {React.DragEvent<HTMLDivElement>} e - The drag event.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  /**
   * @function handleDragLeave
   * Resets the drag-over state when the dragged item leaves the column.
   */
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  /**
   * @function handleDrop
   * Handles the drop event, updating the task's status.
   * @param {React.DragEvent<HTMLDivElement>} e - The drop event.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.id === taskId);

    // Check if the task is already in this column to prevent unnecessary updates
    if (taskId && (!task || task.status !== status)) {
      onTaskStatusChange(taskId, status);
    }
    setIsDragOver(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">{status}</h2>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-lg bg-muted/50 p-4 min-h-[200px] transition-colors",
          isDragOver && "bg-accent/20 border-dashed border-2 border-accent",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const projectCategoryIds = project?.categoryIds?.length
              ? project.categoryIds
              : project?.categoryId
                ? [project.categoryId]
                : [];
            const projectCategories = categories.filter((c) =>
              projectCategoryIds.includes(c.id),
            );
            return (
              <KanbanCard
                key={task.id}
                task={task}
                projectName={project?.name || "Unknown Project"}
                categories={projectCategories}
                onDoubleClick={() => onTaskSelect(task)}
              />
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center py-4">
              {isDragOver ? "Drop task here" : "No tasks"}
            </p>
          </div>
        )}

        <CreateTaskDialog
          onTaskCreated={onCreateTask}
          defaultStatus={status}
          defaultProjectId={
            selectedProjectId !== "all" ? selectedProjectId : undefined
          }
        >
          <Button
            variant="ghost"
            className="w-full mt-2"
            disabled={!canCreateTask}
            title={
              canCreateTask
                ? "Add a new task"
                : "Select a project to add a task"
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CreateTaskDialog>
      </div>
    </div>
  );
}
