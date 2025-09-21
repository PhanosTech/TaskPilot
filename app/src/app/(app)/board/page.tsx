
"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import { KanbanBoard } from "@/components/board/kanban-board";
import type { Task, TaskStatus, Subtask } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { DataContext } from "@/context/data-context";

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

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  const inProgressProjects = useMemo(() => projects.filter(p => p.status === 'In Progress'), [projects]);

  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'logs'>) => {
    // projectId should be set in the data
    if (newTaskData.projectId) {
       createTask(newTaskData);
    }
  };

  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
  };

  const handleSubtaskChange = (taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
    updateSubtask(taskId, subtaskId, changes);
  };
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  
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
