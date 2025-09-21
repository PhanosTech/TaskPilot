
"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "../tasks/create-task-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @interface KanbanColumnProps
 * Props for the KanbanColumn component.
 */
interface KanbanColumnProps {
  /** The status this column represents (e.g., 'To Do', 'In Progress'). */
  status: TaskStatus;
  /** The array of tasks to display in this column. */
  tasks: Task[];
  /** 
   * Callback function to handle changing a task's status, typically via drag-and-drop.
   * @param {string} taskId - The ID of the task to update.
   * @param {TaskStatus} newStatus - The new status for the task.
   */
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  /** 
   * Callback function to handle the creation of a new task within this column.
   * @param {Omit<Task, 'id' | 'logs'>} data - The data for the new task.
   */
  onCreateTask: (data: Omit<Task, 'id' | 'logs'>) => void;
  /** 
   * Callback function when a task card is selected.
   * @param {Task} task - The selected task object.
   */
  onTaskSelect: (task: Task) => void;
  /** The ID of the currently selected project, used as a default for new tasks. */
  selectedProjectId: string;
}

/**
 * @component KanbanColumn
 * Renders a single column in the Kanban board, representing a task status.
 * It displays tasks for that status and handles drag-and-drop operations.
 * @param {KanbanColumnProps} props - The component props.
 * @returns {JSX.Element} The rendered Kanban column.
 */
export function KanbanColumn({ status, tasks, onTaskStatusChange, onCreateTask, onTaskSelect, selectedProjectId }: KanbanColumnProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * Handles the successful creation of a task from the dialog.
   * @param {Omit<Task, 'id' | 'logs'>} data - The new task data.
   */
  const handleCreate = (data: Omit<Task, 'id' | 'logs'>) => {
    onCreateTask(data);
    setCreateDialogOpen(false); // Close dialog on successful creation
  };

  /**
   * Handles the drag-over event to indicate a valid drop target.
   * @param {React.DragEvent<HTMLDivElement>} e - The drag event.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  /**
   * Handles the drag-leave event to reset the drop target indicator.
   */
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  /**
   * Handles the drop event to update the task's status.
   * @param {React.DragEvent<HTMLDivElement>} e - The drop event.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id === taskId);
    
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
            isDragOver && "bg-accent/20 border-dashed border-2 border-accent"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <KanbanCard 
              key={task.id} 
              task={task} 
              onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
              onDoubleClick={() => onTaskSelect(task)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center py-4">
                {isDragOver ? "Drop task here" : "No tasks"}
            </p>
          </div>
        )}
        
        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTaskCreated={handleCreate}
          defaultStatus={status}
          defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        >
          <Button variant="ghost" className="w-full mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CreateTaskDialog>

      </div>
    </div>
  );
}
