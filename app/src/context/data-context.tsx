
"use client";

import { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type { Project, Task, Subtask, ProjectStatus, TaskStatus } from '@/lib/types';

/**
 * A simple debounce function to delay the execution of a function.
 * @template F - The type of the function to debounce.
 * @param {F} func - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {(...args: Parameters<F>) => void} A debounced version of the function.
 */
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

/**
 * @interface DataContextType
 * Defines the shape of the data context, including application state and updater functions.
 */
interface DataContextType {
  /** The array of all projects. */
  projects: Project[];
  /** The array of all tasks. */
  tasks: Task[];
  /** A boolean indicating if the initial data is being loaded. */
  isLoading: boolean;
  /**
   * Creates a new project.
   * @param {object} data - The data for the new project.
   * @param {string} data.name - The name of the project.
   * @param {string} [data.description] - The description of the project.
   */
  createProject: (data: { name: string; description?: string }) => void;
  /**
   * Updates an existing project.
   * @param {string} projectId - The ID of the project to update.
   * @param {Partial<Project>} data - An object containing the project properties to update.
   */
  updateProject: (projectId: string, data: Partial<Project>) => void;
  /**
   * Deletes a project and all its associated tasks.
   * @param {string} projectId - The ID of the project to delete.
   */
  deleteProject: (projectId: string) => void;
  /**
   * Retrieves all tasks for a specific project.
   * @param {string} projectId - The ID of the project.
   * @returns {Task[]} An array of tasks belonging to the project.
   */
  getProjectTasks: (projectId: string) => Task[];
  /**
   * Creates a new task.
   * @param {Omit<Task, 'id' | 'logs'>} data - The data for the new task.
   */
  createTask: (data: Omit<Task, 'id' | 'logs'>) => void;
  /**
   * Updates an existing task.
   * @param {string} taskId - The ID of the task to update.
   * @param {Partial<Task>} data - An object containing the task properties to update.
   */
  updateTask: (taskId: string, data: Partial<Task>) => void;
  /**
   * Deletes a task.
   * @param {string} taskId - The ID of the task to delete.
   */
  deleteTask: (taskId: string) => void;
  /**
   * Updates the status of a task.
   * @param {string} taskId - The ID of the task to update.
   * @param {TaskStatus} newStatus - The new status for the task.
   */
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  /**
   * Updates a specific subtask within a task.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to update.
   * @param {Partial<Subtask>} changes - An object with the subtask properties to change.
   */
  updateSubtask: (taskId: string, subtaskId: string, changes: Partial<Subtask>) => void;
  /**
   * Adds a new subtask to a task.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   * @param {number} storyPoints - The story points for the new subtask.
   */
  addSubtask: (taskId: string, subtaskTitle: string, storyPoints: number) => void;
  /**
   * Removes a subtask from a task.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to remove.
   */
  removeSubtask: (taskId:string, subtaskId: string) => void;
  /**
   * Adds a new work log to a task.
   * @param {string} taskId - The ID of the task to add the log to.
   * @param {string} logContent - The content of the new log entry.
   */
  addLog: (taskId: string, logContent: string) => void;
   /**
   * Updates an existing work log for a task.
   * @param {string} taskId - The ID of the task containing the log.
   * @param {string} logId - The ID of the log to update.
   * @param {string} newContent - The new content for the log.
   */
  updateLog: (taskId: string, logId: string, newContent: string) => void;
  /**
   * Deletes a work log from a task.
   * @param {string} taskId - The ID of the task containing the log.
   * @param {string} logId - The ID of the log to delete.
   */
  deleteLog: (taskId: string, logId: string) => void;
}

/**
 * React context for managing global application data (projects, tasks).
 */
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
  deleteTask: () => {},
  updateTaskStatus: () => {},
  updateSubtask: () => {},
  addSubtask: () => {},
  removeSubtask: () => {},
  addLog: () => {},
  updateLog: () => {},
  deleteLog: () => {},
});

/**
 * Provides application-wide state management for projects and tasks.
 * It handles loading data from and saving data to a persistent source.
 * @param {{ children: ReactNode }} props - The component props.
 * @returns {JSX.Element} The provider component wrapping its children.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Saves the current state of projects and tasks to the server via an API call.
   * @param {Project[]} currentProjects - The current array of projects.
   * @param {Task[]} currentTasks - The current array of tasks.
   */
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

  const createTask = useCallback((data: Omit<Task, 'id' | 'logs'>) => {
    const subtasks = data.subtasks || [];
    const storyPoints = subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      logs: [],
      ...data,
      subtasks,
      storyPoints,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);
  
  const updateTask = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedTask = { ...t, ...data };
          // Recalculate story points if subtasks are part of the update
          if (data.subtasks) {
            updatedTask.storyPoints = data.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
          }
          return updatedTask;
        }
        return t;
      })
    );
  }, []);
  
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);
  
  const updateSubtask = useCallback((taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newSubtasks = task.subtasks.map(subtask => 
          subtask.id === subtaskId ? { ...subtask, ...changes } : subtask
        );
        const newStoryPoints = newSubtasks.reduce((sum, st) => sum + st.storyPoints, 0);
        return {
          ...task,
          subtasks: newSubtasks,
          storyPoints: newStoryPoints,
        };
      }
      return task;
    }));
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
          const newSubtasks = [...task.subtasks, newSubtask];
          const newStoryPoints = newSubtasks.reduce((sum, st) => sum + st.storyPoints, 0);
          return { ...task, subtasks: newSubtasks, storyPoints: newStoryPoints };
        }
        return task;
      })
    );
  }, []);
  
  const removeSubtask = useCallback((taskId: string, subtaskId: string) => {
     setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
          const newStoryPoints = newSubtasks.reduce((sum, st) => sum + st.storyPoints, 0);
          return { ...task, subtasks: newSubtasks, storyPoints: newStoryPoints };
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

  const updateLog = useCallback((taskId: string, logId: string, newContent: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          logs: task.logs.map(log => 
            log.id === logId ? { ...log, content: newContent, createdAt: new Date().toISOString() } : log
          )
        };
      }
      return task;
    }));
  }, []);

  const deleteLog = useCallback((taskId: string, logId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          logs: task.logs.filter(log => log.id !== logId)
        };
      }
      return task;
    }));
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
    deleteTask,
    updateTaskStatus,
    updateSubtask,
    addSubtask,
    removeSubtask,
    addLog,
    updateLog,
    deleteLog,
  };

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
