"use client";

import { useState, useMemo, useContext } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Project, ProjectStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataContext } from "@/context/data-context";
import { cn } from "@/lib/utils";
import { quickTaskToTask } from "@/lib/quick-task-utils";
import { ManageCategoriesDialog } from "@/components/projects/manage-categories-dialog";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { CategoryMultiSelect } from "@/components/projects/category-multi-select";

const SHARED_CATEGORY_STORAGE_KEY = "taskpilot-shared-category-v2";
const statusOrder: ProjectStatus[] = [
  "In Progress",
  "Backlog",
  "Done",
  "Archived",
];

export default function ProjectsPage() {
  const { projects, tasks, quickTasks, categories, createProject, updateProject } =
    useContext(DataContext);
  const [showArchived, setShowArchived] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [filterCategoryIds, setFilterCategoryIds] = usePersistentState<string[]>(
    SHARED_CATEGORY_STORAGE_KEY,
    [],
  );

  const projectsWithProgress = useMemo(
    () =>
      projects.map((project) => {
        const projectTasks = tasks.filter(
          (task) => task.projectId === project.id,
        );
        const projectQuickTasks = quickTasks.filter(
          (quickTask) => quickTask.projectId === project.id,
        );
        const allTasks = [
          ...projectTasks,
          ...projectQuickTasks.map(quickTaskToTask),
        ];

        const totalStoryPoints = allTasks.reduce(
          (sum, task) => sum + task.storyPoints,
          0,
        );

        const completedStoryPoints = allTasks.reduce((sum, task) => {
          if (task.status === "Done") {
            return sum + task.storyPoints;
          }

          const totalSubtaskPoints = task.subtasks.reduce(
            (subSum, st) => subSum + st.storyPoints,
            0,
          );
          if (totalSubtaskPoints === 0) {
            return sum;
          }

          const completedSubtaskPoints = task.subtasks
            .filter((st) => st.isCompleted)
            .reduce((subSum, st) => subSum + st.storyPoints, 0);

          const taskProgress = completedSubtaskPoints / totalSubtaskPoints;
          return sum + task.storyPoints * taskProgress;
        }, 0);

        const progress =
          totalStoryPoints > 0
            ? (completedStoryPoints / totalStoryPoints) * 100
            : 0;

        return {
          ...project,
          taskCount: projectTasks.length + projectQuickTasks.length,
          progress,
        };
      }),
    [projects, tasks, quickTasks],
  );

  const sortedProjects = useMemo(() => {
    return [...projectsWithProgress].sort((a, b) => {
      // Primary sort: by status order
      const statusIndexA = statusOrder.indexOf(a.status);
      const statusIndexB = statusOrder.indexOf(b.status);
      if (statusIndexA !== statusIndexB) {
        return statusIndexA - statusIndexB;
      }

      // Secondary sort: by priority (descending)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Tertiary sort: by name
      return a.name.localeCompare(b.name);
    });
  }, [projectsWithProgress]);

  const filteredProjects = useMemo(() => {
    return sortedProjects.filter((p) => {
      if (p.status === "Archived" && !showArchived) return false;
      if (p.status === "Done" && !showDone) return false;
      if (filterCategoryIds.length === 0) return true;

      const ids =
        p.categoryIds && p.categoryIds.length > 0
          ? p.categoryIds
          : p.categoryId
            ? [p.categoryId]
            : [];

      if (filterCategoryIds.includes("cat-default")) {
        // 'cat-default' matches projects that explicitly include it or have no categories assigned.
        if (ids.length === 0 || ids.includes("cat-default")) return true;
      }

      return filterCategoryIds.some((categoryId) => ids.includes(categoryId));
    });
  }, [sortedProjects, showArchived, showDone, filterCategoryIds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex items-center gap-4">
          <CategoryMultiSelect
            categories={categories}
            selectedIds={filterCategoryIds}
            onChange={setFilterCategoryIds}
            placeholder="All categories"
            emptyLabel="All categories"
            showBadges={false}
            className="w-64"
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="show-done"
              checked={showDone}
              onCheckedChange={setShowDone}
            />
            <Label htmlFor="show-done">Show Done</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">Show Archived</Label>
          </div>
          <ManageCategoriesDialog />
          <CreateProjectDialog onCreateProject={createProject} />
        </div>
      </div>

      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pri</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Task Count</TableHead>
              <TableHead className="w-[200px]">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => {
              const categoryIds =
                project.categoryIds && project.categoryIds.length > 0
                  ? project.categoryIds
                  : project.categoryId
                    ? [project.categoryId]
                    : [];
              const projectCategories = categories.filter((cat) =>
                categoryIds.includes(cat.id),
              );
              return (
                <TableRow
                  key={project.id}
                  className={cn(
                    project.status === "Backlog" &&
                      "bg-muted/30 text-muted-foreground",
                    project.status === "Archived" &&
                      "text-muted-foreground opacity-50 italic line-through",
                    project.status === "Done" &&
                      "text-muted-foreground line-through opacity-80",
                  )}
                >
                  <TableCell className="align-middle">
                    <Input
                      type="number"
                      value={project.priority ?? 4}
                      onChange={(e) =>
                        updateProject(project.id, {
                          priority: parseInt(e.target.value, 10) || 4,
                        })
                      }
                      className="w-16 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className={cn(
                          "font-medium hover:underline",
                          project.status === "Backlog"
                            ? "text-muted-foreground"
                            : "text-primary",
                        )}
                      >
                        {project.name}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {projectCategories
                          .filter((cat) => cat.id !== "cat-default")
                          .map((cat) => (
                            <Badge
                              key={cat.id}
                              variant="outline"
                              style={{
                                borderColor: cat.color,
                                color: cat.color,
                              }}
                            >
                              {cat.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {project.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={project.status}
                      onValueChange={(newStatus: ProjectStatus) =>
                        updateProject(project.id, { status: newStatus })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{project.taskCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={project.progress}
                        className="w-full"
                        aria-label={`${project.progress}% complete`}
                      />
                      <span className="text-xs w-10 text-right">
                        {Math.round(project.progress)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
