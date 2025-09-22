
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import type { Task } from "@/lib/types";
import { DataContext } from "@/context/data-context";
import { KanbanBoard } from "@/components/board/kanban-board";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";

/**
 * @page BoardPage
 * Renders the main Kanban board view for managing tasks across different statuses.
 * Users can filter tasks by project and interact with task cards.
 */
export default function BoardPage() {
  const { 
    projects, 
    tasks, 
    createTask, 
    updateTask, 
    updateTaskStatus,
    updateSubtask, 
    addSubtask, 
    removeSubtask, 
    addLog,
    updateLog,
    deleteLog
  } = useContext(DataContext);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  // Re-fetch the selected task from the main tasks array whenever it changes.
  // This ensures the dialog always has the latest data.
  const liveSelectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId);
  }, [selectedTaskId, tasks]);

  const inProgressProjects = useMemo(() => projects.filter(p => p.status === 'In Progress'), [projects]);

  const filteredTasks = useMemo(() => {
    const activeProjectIds = new Set(inProgressProjects.map(p => p.id));

    if (selectedProjectId === "all") {
      return tasks.filter(task => activeProjectIds.has(task.projectId));
    }
    
    if (activeProjectIds.has(selectedProjectId)) {
       return tasks.filter(task => task.projectId === selectedProjectId);
    }
    
    return []; // Return empty if a non-in-progress project is somehow selected
  }, [selectedProjectId, tasks, inProgressProjects]);
  

  /**
   * @function handleCreateTask
   * Creates a new task.
   * @param {Omit<Task, 'id' | 'logs' | 'storyPoints'>} newTaskData - The data for the new task.
   */
  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'logs' | 'storyPoints'>) => {
    createTask(newTaskData);
  };

  /**
   * @function handleUpdateTask
   * Updates an existing task with partial data.
   * @param {string} taskId - The ID of the task to update.
   * @param {Partial<Task>} updatedData - The data to update.
   */
  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
  };
  
  /**
   * @function handleTaskSelect
   * Sets the currently selected task to open the detail dialog.
   * @param {Task} task - The selected task.
   */
  const handleTaskSelect = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="w-full max-w-xs">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All In-Progress Projects</SelectItem>
              {inProgressProjects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <KanbanBoard 
        tasks={filteredTasks} 
        onTaskStatusChange={updateTaskStatus}
        onCreateTask={handleCreateTask}
        onTaskSelect={handleTaskSelect}
        selectedProjectId={selectedProjectId}
      />
      
      {liveSelectedTask && (
        <TaskDetailDialog 
          task={liveSelectedTask} 
          open={!!liveSelectedTask} 
          onOpenChange={(isOpen) => !isOpen && setSelectedTaskId(null)}
          onUpdateTask={handleUpdateTask}
          onSubtaskChange={updateSubtask}
          onAddSubtask={addSubtask}
          onRemoveSubtask={removeSubtask}
          onAddLog={addLog}
          onUpdateLog={updateLog}
          onDeleteLog={deleteLog}
        />
      )}
    </div>
  );
}
