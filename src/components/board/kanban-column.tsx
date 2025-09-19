
"use client";

import type { Task, TaskStatus } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "../tasks/create-task-dialog";
import { useState } from "react";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (data: Omit<Task, 'id' | 'logs'>) => void;
  onTaskSelect: (task: Task) => void;
  selectedProjectId: string;
}

export function KanbanColumn({ status, tasks, onTaskStatusChange, onCreateTask, onTaskSelect, selectedProjectId }: KanbanColumnProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreate = (data: Omit<Task, 'id' | 'logs'>) => {
    onCreateTask(data);
    setCreateDialogOpen(false); // Close dialog on successful creation
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
      <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 min-h-[200px]">
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
          <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
        )}
        
        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateTask={handleCreate}
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
