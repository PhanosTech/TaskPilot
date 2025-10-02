"use client";

import {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import type {
  Project,
  Task,
  Subtask,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  Log,
  ProjectCategory,
  Note,
} from "@/lib/types";
import {
  DEFAULT_PROJECT_PRIORITY,
  DEFAULT_TASK_PRIORITY,
} from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// Debounce function to delay execution
const debounce = <F extends (...args: any[]) => void>(
  func: F,
  delay: number,
) => {
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
 * Defines the shape of the data and functions provided by the DataContext.
 */
interface DataContextType {
  projects: Project[];
  tasks: Task[];
  categories: ProjectCategory[];
  isLoading: boolean;
  createProject: (data: {
    name: string;
    description?: string;
    priority?: number;
    categoryId?: string;
  }) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  getProjectTasks: (projectId: string) => Task[];
  createTask: (data: Omit<Task, "id" | "logs" | "storyPoints">) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  updateSubtask: (
    taskId: string,
    subtaskId: string,
    changes: Partial<Subtask>,
  ) => void;
  addSubtask: (
    taskId: string,
    subtaskTitle: string,
    storyPoints: number,
  ) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  addLog: (taskId: string, logContent: string) => void;
  updateLog: (taskId: string, logId: string, newContent: string) => void;
  deleteLog: (taskId: string, logId: string) => void;
  createCategory: (data: { name: string; color: string }) => void;
  updateCategory: (categoryId: string, data: Partial<ProjectCategory>) => void;
  deleteCategory: (categoryId: string) => void;
}

/**
 * @const DataContext
 * The React context for providing application data and manipulation functions.
 */
export const DataContext = createContext<DataContextType>({
  projects: [],
  tasks: [],
  categories: [],
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
  createCategory: () => {},
  updateCategory: () => {},
  deleteCategory: () => {},
});

/**
 * @provider DataProvider
 *
 * A component that provides the DataContext to its children.
 * It manages the state of projects and tasks, and handles data persistence.
 *
 * Notes about multi-category support and compatibility:
 * - Projects historically used a single `categoryId: string`. To support tagging
 *   projects with multiple categories, we introduced `categoryIds?: string[]`.
 * - Backwards compatibility:
 *   - When creating/updating projects we keep the legacy `categoryId` populated
 *     for consumers that still expect a single category (we set it to the first
 *     entry of `categoryIds` when present).
 *   - When reading older data that only contains `categoryId`, other code paths
 *     should treat it like `categoryIds = [categoryId]` where multi-category
 *     behavior is required.
 * - Migration strategy:
 *   - New writes will populate `categoryIds` and also keep `categoryId` set.
 *   - Deleting a category will remove it from `categoryIds` for all projects.
 *     If a project ends up with no categories we fall back to `['cat-default']`
 *     and set `categoryId = 'cat-default'`.
 *
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoaded = useRef(false);

  // --- Server Mode: Save data to API ---
  // We now return a boolean success indicator and surface save-state via toasts.
  const { toast } = useToast();
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const saveDataToServer = useCallback(
    async (
      currentProjects: Project[],
      currentTasks: Task[],
      currentCategories: ProjectCategory[],
    ) => {
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projects: currentProjects,
            tasks: currentTasks,
            categories: currentCategories,
          }),
        });
        if (!res.ok) {
          console.error("Failed to save data to server, status:", res.status);
          return false;
        }
        return true;
      } catch (error) {
        console.error("Failed to save data to server:", error);
        return false;
      }
    },
    [],
  );

  // Debounced wrapper that updates UI state and shows a toast on completion.
  const debouncedSave = useRef(
    debounce(
      (
        currentProjects: Project[],
        currentTasks: Task[],
        currentCategories: ProjectCategory[],
      ) => {
        (async () => {
          try {
            setSaveState("saving");
            const ok = await saveDataToServer(
              currentProjects,
              currentTasks,
              currentCategories,
            );
            if (ok) {
              setSaveState("saved");
              toast({ title: "Saved", description: "Data saved to storage." });
            } else {
              setSaveState("error");
              toast({
                title: "Save failed",
                description: "Failed to save data; see console.",
                variant: "destructive",
              });
            }
          } catch (err) {
            setSaveState("error");
            toast({
              title: "Save failed",
              description: "Failed to save data; see console.",
              variant: "destructive",
            });
            console.error(err);
          } finally {
            // revert to idle after a short delay so UI doesn't stay 'saved' permanently
            setTimeout(() => setSaveState("idle"), 1500);
          }
        })();
      },
      1000,
    ),
  ).current;

  // Immediate save helper that callers can await; returns true on success.
  const forceSave = useCallback(async () => {
    try {
      setSaveState("saving");
      const ok = await saveDataToServer(projects, tasks, categories);
      if (ok) {
        setSaveState("saved");
        toast({ title: "Saved", description: "Data saved to storage." });
      } else {
        setSaveState("error");
        toast({
          title: "Save failed",
          description: "Failed to save data; see console.",
          variant: "destructive",
        });
      }
      setTimeout(() => setSaveState("idle"), 1500);
      return !!ok;
    } catch (err) {
      setSaveState("error");
      toast({
        title: "Save failed",
        description: "Failed to save data; see console.",
        variant: "destructive",
      });
      console.error("forceSave failed:", err);
      setTimeout(() => setSaveState("idle"), 1500);
      return false;
    }
  }, [projects, tasks, categories, saveDataToServer, toast]);

  // --- Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/data");
        const data = await response.json();

        setProjects(data.projects || []);
        setTasks(data.tasks || []);
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load data from server:", error);
      } finally {
        setIsLoading(false);
        isLoaded.current = true;
      }
    };
    loadData();
  }, []);

  // --- Persist Data on Changes ---
  useEffect(() => {
    if (!isLoaded.current) return;
    debouncedSave(projects, tasks, categories);
  }, [projects, tasks, categories, debouncedSave]);

  const createProject = useCallback(
    (data: {
      name: string;
      description?: string;
      priority?: number;
      categoryId?: string;
      categoryIds?: string[];
    }) => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: data.name,
        description: data.description || "",
        notes: [
          {
            id: `note-${Date.now()}`,
            title: "Main",
            parentId: null,
            content: "",
          } as Note,
        ],
        status: "Backlog",
        priority: data.priority ?? DEFAULT_PROJECT_PRIORITY,
        // Keep legacy single category for backward compatibility (first category)
        categoryId:
          data.categoryId ||
          (data.categoryIds && data.categoryIds[0]) ||
          "cat-default",
        // Support multiple categories per project. If none provided, fallback to legacy category or default.
        categoryIds:
          data.categoryIds && data.categoryIds.length > 0
            ? data.categoryIds
            : [data.categoryId || "cat-default"],
      };
      setProjects((prev) => [...prev, newProject]);
    },
    [],
  );

  const updateProject = useCallback(
    /**
     * Update a project by merging provided partial data.
     *
     * Special handling for categories for backward compatibility:
     * - If `data.categoryIds` is provided (the new multi-category API), we set
     *   project.categoryIds = data.categoryIds and keep project.categoryId set
     *   to the first id for legacy consumers.
     * - If only `data.categoryId` is provided, we update the legacy field and
     *   ensure categoryIds contains at least that id.
     */
    (projectId: string, data: Partial<Project>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;

          // Start from a shallow merge
          const merged: Project = { ...p, ...data } as Project;

          // If caller provided new categoryIds, trust it as the canonical multi-category set.
          if ((data as Partial<Project>).categoryIds) {
            const newIds = (data as Partial<Project>).categoryIds || [];
            merged.categoryIds = newIds.length > 0 ? newIds : ["cat-default"];
            // Maintain legacy single categoryId (first item) for compatibility
            merged.categoryId = merged.categoryIds[0] || "cat-default";
          } else if ((data as Partial<Project>).categoryId) {
            // Caller provided legacy single categoryId: keep both fields consistent
            const cid = (data as Partial<Project>).categoryId || "cat-default";
            merged.categoryId = cid;
            // If there were no categoryIds previously, initialize with the single value.
            merged.categoryIds =
              merged.categoryIds && merged.categoryIds.length > 0
                ? merged.categoryIds
                : [cid];
          } else {
            // If neither is provided, ensure existing arrays remain untouched.
            merged.categoryIds =
              merged.categoryIds ||
              (merged.categoryId ? [merged.categoryId] : ["cat-default"]);
            merged.categoryId =
              merged.categoryId || merged.categoryIds[0] || "cat-default";
          }

          return merged;
        }),
      );
    },
    [],
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
  }, []);

  const getProjectTasks = useCallback(
    (projectId: string) => {
      return tasks.filter((task) => task.projectId === projectId);
    },
    [tasks],
  );

  const createTask = useCallback(
    (data: Omit<Task, "id" | "logs" | "storyPoints">) => {
      const subtasks = data.subtasks || [];
      const storyPoints = subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...data,
        priority: (data as any).priority ?? DEFAULT_TASK_PRIORITY,
        storyPoints,
        logs: [],
        subtasks,
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [],
  );

  const updateTask = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedTask = { ...t, ...data };
          // Recalculate story points if subtasks are part of the update
          if (data.subtasks) {
            updatedTask.storyPoints = data.subtasks.reduce(
              (sum, st) => sum + st.storyPoints,
              0,
            );
          }
          return updatedTask;
        }
        return t;
      }),
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const updateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
    },
    [],
  );

  const updateSubtask = useCallback(
    (taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const newSubtasks = task.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, ...changes } : subtask,
            );
            const newStoryPoints = newSubtasks.reduce(
              (sum, st) => sum + st.storyPoints,
              0,
            );
            return {
              ...task,
              subtasks: newSubtasks,
              storyPoints: newStoryPoints,
            };
          }
          return task;
        }),
      );
    },
    [],
  );

  const addSubtask = useCallback(
    (taskId: string, subtaskTitle: string, storyPoints: number) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const newSubtask: Subtask = {
              id: `sub-${Date.now()}`,
              title: subtaskTitle,
              isCompleted: false,
              storyPoints,
            };
            const newSubtasks = [...task.subtasks, newSubtask];
            const newStoryPoints = newSubtasks.reduce(
              (sum, st) => sum + st.storyPoints,
              0,
            );
            return {
              ...task,
              subtasks: newSubtasks,
              storyPoints: newStoryPoints,
            };
          }
          return task;
        }),
      );
    },
    [],
  );

  const removeSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const newSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
          const newStoryPoints = newSubtasks.reduce(
            (sum, st) => sum + st.storyPoints,
            0,
          );
          return {
            ...task,
            subtasks: newSubtasks,
            storyPoints: newStoryPoints,
          };
        }
        return task;
      }),
    );
  }, []);

  const addLog = useCallback((taskId: string, logContent: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const newLog: Log = {
            id: `log-${Date.now()}`,
            content: logContent,
            createdAt: new Date().toISOString(),
          };
          return { ...task, logs: [...task.logs, newLog] };
        }
        return task;
      }),
    );
  }, []);

  const updateLog = useCallback(
    (taskId: string, logId: string, newContent: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const newLogs = task.logs.map((log) =>
              log.id === logId ? { ...log, content: newContent } : log,
            );
            return { ...task, logs: newLogs };
          }
          return task;
        }),
      );
    },
    [],
  );

  const deleteLog = useCallback((taskId: string, logId: string) => {
    // TODO: Consider returning a status or throwing an error so callers can react.
    // This implementation is intentionally tolerant: it logs warnings for missing
    // tasks/logs but does not throw. That keeps the UI smooth while preserving
    // backward compatibility (no API signature change).
    setTasks((prev) => {
      let matchedTask = false;

      const updated = prev.map((task) => {
        if (task.id === taskId) {
          matchedTask = true;

          // If the log isn't present, log a warning and leave the task unchanged.
          const logExists = task.logs.some((l) => l.id === logId);
          if (!logExists) {
            // Useful to surface in dev consoles when debugging missing deletes.
            // In production you may want to remove or route these to a telemetry system.
            // eslint-disable-next-line no-console
            console.warn(
              `deleteLog: log "${logId}" not found for task "${taskId}"`,
            );
            return task;
          }

          const newLogs = task.logs.filter((log) => log.id !== logId);
          return { ...task, logs: newLogs };
        }
        return task;
      });

      if (!matchedTask) {
        // Task not found in the current state — warn so maintainers can notice.
        // eslint-disable-next-line no-console
        console.warn(`deleteLog: task "${taskId}" not found`);
      }

      return updated;
    });
  }, []);

  const createCategory = useCallback(
    (data: { name: string; color: string }) => {
      const newCategory: ProjectCategory = {
        id: `cat-${Date.now()}`,
        ...data,
      };
      setCategories((prev) => [...prev, newCategory]);
    },
    [],
  );

  const updateCategory = useCallback(
    (categoryId: string, data: Partial<ProjectCategory>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, ...data } : c)),
      );
    },
    [],
  );

  const deleteCategory = useCallback((categoryId: string) => {
    if (categoryId === "cat-default") return; // Cannot delete default

    // Remove the category itself
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

    // For every project, remove the deleted category from its categoryIds array (if present).
    // Ensure each project has at least one category (fallback to 'cat-default') and keep the legacy
    // `categoryId` property in sync (set to the first categoryId).
    setProjects((prev) =>
      prev.map((p) => {
        const existingIds = Array.isArray(p.categoryIds)
          ? p.categoryIds.slice()
          : p.categoryId
            ? [p.categoryId]
            : [];
        const filtered = existingIds.filter((id) => id !== categoryId);
        const newIds = filtered.length > 0 ? filtered : ["cat-default"];
        return {
          ...p,
          categoryIds: newIds,
          categoryId: newIds[0] || "cat-default",
        };
      }),
    );
  }, []);

  const value = {
    projects,
    tasks,
    categories,
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
    createCategory,
    updateCategory,
    deleteCategory,
    // Expose forceSave so UI can trigger an immediate persistence and receive success/failure
    forceSave,
    // Expose saveState so UI may render a small indicator (e.g., header)
    saveState,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
