
"use client";

import { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type { Project, Task, Subtask, ProjectStatus, TaskStatus } from '@/lib/types';

// Debounce function to delay execution
const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  createProject: (data: { name: string; description?: string }) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  getProjectTasks: (projectId: string) => Task[];
  createTask: (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'logs' | 'subtasks' | 'storyPoints'> & { storyPoints?: number }) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  addSubtask: (taskId: string, subtaskTitle: string, storyPoints: number) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  addLog: (taskId: string, logContent: string) => void;
}

export const DataContext = createContext<DataContextType>({
  projects: [],
  tasks: [],
  isLoading: true,
  createProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
  getProjectTasks: () => [],
  createTask: () => {},
  updateTask: () => {},
  updateTaskStatus: () => {},
  addSubtask: () => {},
  removeSubtask: () => {},
  addLog: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Server Mode: Save data to API ---
  const saveDataToServer = useCallback(async (currentProjects: Project[], currentTasks: Task[]) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: currentProjects, tasks: currentTasks }),
      });
    } catch (error) {
      console.error("Failed to save data to server:", error);
    }
  }, []);

  const debouncedSave = useRef(debounce(saveDataToServer, 1000)).current;

  // --- Load Data ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        if (data.projects && data.tasks) {
          setProjects(data.projects);
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error("Failed to load data from server:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);
  
  // --- Persist Data on Changes ---
  useEffect(() => {
    if (isLoading) return;
    debouncedSave(projects, tasks);
  }, [projects, tasks, isLoading, debouncedSave]);

  const createProject = useCallback((data: { name: string; description?: string }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      description: data.description || "",
      notes: [{ id: `note-${Date.now()}`, title: "Main", content: "", parentId: undefined }],
      status: 'Backlog',
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((projectId: string, data: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, ...data } : p))
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  }, []);

  const getProjectTasks = useCallback((projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks]);

    const createTask = useCallback((projectId: string, data: Omit<Task, 'id' | 'projectId' | 'logs' | 'subtasks' | 'storyPoints'> & { storyPoints?: number }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId,
      logs: [],
      subtasks: [],
      storyPoints: data.storyPoints || 0,
      ...data,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);
  
  const updateTask = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...data } : t))
    );
  }, []);

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);
  
  const addSubtask = useCallback((taskId: string, subtaskTitle: string, storyPoints: number) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newSubtask: Subtask = {
            id: `sub-${Date.now()}`,
            title: subtaskTitle,
            isCompleted: false,
            storyPoints,
          };
          return { ...task, subtasks: [...task.subtasks, newSubtask] };
        }
        return task;
      })
    );
  }, []);
  
  const removeSubtask = useCallback((taskId: string, subtaskId: string) => {
     setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) };
        }
        return task;
      })
    );
  }, []);
  
  const addLog = useCallback((taskId: string, logContent: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newLog = {
            id: `log-${Date.now()}`,
            content: logContent,
            createdAt: new Date().toISOString(),
          };
          return { ...task, logs: [...task.logs, newLog] };
        }
        return task;
      })
    );
  }, []);

  const value = {
    projects,
    tasks,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    getProjectTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    addSubtask,
    removeSubtask,
    addLog,
  };

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
