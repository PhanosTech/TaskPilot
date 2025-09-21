
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import { KanbanBoard } from "@/components/board/kanban-board";
import type { Task, TaskStatus, Subtask } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { DataContext } from "@/context/data-context";

/**
 * @page BoardPage
 * Renders the main Kanban board view. It allows users to visualize tasks
 * across different statuses and filter them by project.
 * @returns {JSX.Element} The rendered Kanban board page.
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
    deleteLog,
  } = useContext(DataContext);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Memoize the selected task to avoid re-finding it on every render.
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  // Memoize the list of projects that are currently "In Progress".
  const inProgressProjects = useMemo(() => projects.filter(p => p.status === 'In Progress'), [projects]);

  /**
   * Handles the creation of a new task from the Kanban board.
   * @param {Omit<Task, 'id' | 'logs'>} newTaskData - The data for the new task.
   */
  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'logs'>) => {
    if (newTaskData.projectId) {
       createTask(newTaskData);
    }
  };

  /**
   * Handles updating a task's details.
   * @param {string} taskId - The ID of the task to update.
   * @param {Partial<Task>} updatedData - The new data for the task.
   */
  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
  };

  /**
   * Handles changes to a subtask (e.g., completion status).
   * @param {string} taskId - The parent task's ID.
   * @param {string} subtaskId - The subtask's ID.
   * @param {Partial<Subtask>} changes - The updated properties for the subtask.
   */
  const handleSubtaskChange = (taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
    updateSubtask(taskId, subtaskId, changes);
  };
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  
  // Memoize the list of tasks to be displayed on the board based on the selected project filter.
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
   * Sets the selected task to be displayed in the detail dialog.
   * @param {Task} task - The task that was selected.
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
      
      {selectedTask && (
        <TaskDetailDialog 
          task={selectedTask} 
          open={!!selectedTask} 
          onOpenChange={(isOpen) => !isOpen && setSelectedTaskId(null)}
          onUpdateTask={handleUpdateTask}
          onSubtaskChange={handleSubtaskChange}
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
