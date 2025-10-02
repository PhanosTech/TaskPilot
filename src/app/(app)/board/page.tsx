"use client";

import { useState, useMemo, useContext, useEffect } from "react";
import type { Task } from "@/lib/types";
import { DataContext } from "@/context/data-context";
import { KanbanBoard } from "@/components/board/kanban-board";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { CategoryMultiSelect } from "@/components/projects/category-multi-select";

const SHARED_CATEGORY_STORAGE_KEY = "taskpilot-shared-category-v2";

// TODO: multi-category support note:
// Projects now support `categoryIds?: string[]` (array of category ids) while keeping the legacy
// `categoryId?: string` for backward compatibility.  When filtering by category prefer checking
// `project.categoryIds` (if present) and fall back to `project.categoryId` so older persisted data
// still works.  Other files that reference `categoryId` should be updated similarly to use
// `categoryIds` where appropriate.

/**
 * @page BoardPage
 * Renders the main Kanban board view for managing tasks across different statuses.
 * Users can filter tasks by project and interact with task cards.
 */
export default function BoardPage() {
  const {
    projects,
    tasks,
    categories,
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
  } = useContext(DataContext);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] =
    usePersistentState<string[]>(SHARED_CATEGORY_STORAGE_KEY, []);

  // Re-fetch the selected task from the main tasks array whenever it changes.
  // This ensures the dialog always has the latest data.
  const liveSelectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, tasks]);

  const inProgressProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects.filter((p) => p.status === "In Progress");

    if (selectedCategoryIds.length > 0) {
      // Support new multi-category `categoryIds` while remaining backward compatible
      filtered = filtered.filter((p) => {
        const ids = p.categoryIds || (p.categoryId ? [p.categoryId] : []);
        if (selectedCategoryIds.includes("cat-default")) {
          if (ids.length === 0 || ids.includes("cat-default")) return true;
        }
        return selectedCategoryIds.some((id) => ids.includes(id));
      });
    }

    return filtered;
  }, [projects, selectedCategoryIds]);

  useEffect(() => {
    if (selectedProjectId === "all") return;
    const stillVisible = inProgressProjects.some(
      (project) => project.id === selectedProjectId,
    );
    if (!stillVisible) {
      setSelectedProjectId("all");
    }
  }, [inProgressProjects, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    if (!tasks || !projects) return [];

    let projectIdsToShow = new Set(
      projects.filter((p) => p.status === "In Progress").map((p) => p.id),
    );

    // Filter projects by category first, if a category is selected.
    // Support multi-category projects via `categoryIds`, fall back to legacy `categoryId`.
    if (selectedCategoryIds.length > 0) {
      const categoryProjectIds = new Set(
        projects
          .filter((p) => {
            const ids = p.categoryIds || (p.categoryId ? [p.categoryId] : []);
            if (selectedCategoryIds.includes("cat-default")) {
              if (ids.length === 0 || ids.includes("cat-default")) return true;
            }
            return selectedCategoryIds.some((id) => ids.includes(id));
          })
          .map((p) => p.id),
      );
      projectIdsToShow = new Set(
        [...projectIdsToShow].filter((id) => categoryProjectIds.has(id)),
      );
    }

    // Then filter by selected project if one is chosen
    if (selectedProjectId !== "all") {
      if (projectIdsToShow.has(selectedProjectId)) {
        projectIdsToShow = new Set([selectedProjectId]);
      } else {
        // If the selected project is not in the initial set (e.g. not "In Progress" or wrong category), show no tasks
        return [];
      }
    }

    return tasks.filter((task) => projectIdsToShow.has(task.projectId));
  }, [selectedProjectId, selectedCategoryIds, tasks, projects]);

  /**
   * @function handleCreateTask
   * Creates a new task.
   * @param {Omit<Task, 'id' | 'logs' | 'storyPoints'>} newTaskData - The data for the new task.
   */
  const handleCreateTask = (
    newTaskData: Omit<Task, "id" | "logs" | "storyPoints">,
  ) => {
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
        <div className="flex items-center gap-2">
          <CategoryMultiSelect
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            placeholder="All categories"
            emptyLabel="All categories"
            showBadges={false}
            className="w-full max-w-xs"
          />
          <div className="w-full max-w-xs">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All In-Progress Projects</SelectItem>
                {inProgressProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          onDeleteTask={deleteTask}
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
