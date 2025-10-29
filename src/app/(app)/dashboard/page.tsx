"use client";

import { useState, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskPriority, TaskStatus, QuickTask } from "@/lib/types";
import { DataContext } from "@/context/data-context";
import { TASK_PRIORITY_ORDER, DEFAULT_PROJECT_PRIORITY } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { PersonalTodos } from "@/components/dashboard/personal-todos";
import { Scratchpad } from "@/components/dashboard/scratchpad";
import { ExternalLink } from "lucide-react";
import { QuickTaskDetailDialog } from "@/components/projects/quick-task-detail-dialog";
import { quickTaskToTask } from "@/lib/quick-task-utils";
import { cn } from "@/lib/utils";

const priorityColors: Record<TaskPriority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

// Use centralized task priority ordering from constants
const priorityOrder: Record<TaskPriority, number> = TASK_PRIORITY_ORDER;

type QueueItem =
  | { kind: "full"; task: Task }
  | { kind: "quick"; task: QuickTask };

/**
 * @page DashboardPage
 * The main dashboard of the application, providing a high-level overview of projects and tasks.
 * It includes an active work queue, personal todos, and a scratchpad.
 */
export default function DashboardPage() {
  const {
    projects,
    tasks,
    quickTasks,
    categories,
    updateTask,
    deleteTask,
    updateSubtask,
    addSubtask,
    removeSubtask,
    addLog,
    updateLog,
    deleteLog,
    updateQuickTask,
    deleteQuickTask,
    addQuickTaskLog,
    updateQuickTaskLog,
    deleteQuickTaskLog,
  } = useContext(DataContext);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedQuickTaskId, setSelectedQuickTaskId] = useState<string | null>(null);
  const [showToDo, setShowToDo] = useState(false);
  const router = useRouter();

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !tasks) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  const selectedQuickTask = useMemo(() => {
    if (!selectedQuickTaskId) return null;
    return quickTasks.find((task) => task.id === selectedQuickTaskId) || null;
  }, [selectedQuickTaskId, quickTasks]);

  const activeWorkQueue = useMemo<QueueItem[]>(() => {
    if (!projects) return [];

    const inProgressProjectIds = new Set(
      projects.filter((p) => p.status === "In Progress").map((p) => p.id),
    );

    const statusesToShow: TaskStatus[] = ["In Progress"];
    if (showToDo) {
      statusesToShow.push("To Do");
    }

    const queue: QueueItem[] = [];

    tasks
      .filter(
        (task) =>
          inProgressProjectIds.has(task.projectId) &&
          statusesToShow.includes(task.status),
      )
      .forEach((task) => queue.push({ kind: "full", task }));

    quickTasks
      .filter(
        (task) =>
          inProgressProjectIds.has(task.projectId) &&
          statusesToShow.includes(task.status),
      )
      .forEach((task) => queue.push({ kind: "quick", task }));

    queue.sort((a, b) => {
      const projectA = projects.find((p) => p.id === a.task.projectId);
      const projectB = projects.find((p) => p.id === b.task.projectId);

      const projectPriorityA = projectA?.priority ?? DEFAULT_PROJECT_PRIORITY;
      const projectPriorityB = projectB?.priority ?? DEFAULT_PROJECT_PRIORITY;

      if (projectPriorityA !== projectPriorityB) {
        return projectPriorityB - projectPriorityA;
      }

      const priorityA = priorityOrder[a.task.priority];
      const priorityB = priorityOrder[b.task.priority];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const titleA = a.task.title.toLowerCase();
      const titleB = b.task.title.toLowerCase();
      return titleA.localeCompare(titleB);
    });

    return queue;
  }, [projects, tasks, quickTasks, showToDo]);

  /**
   * @function handleTaskClick
   * A handler to select a task and open its detail view.
   * @param {Task} task - The task that was clicked.
   */
  const handleFullTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setSelectedQuickTaskId(null);
  };

  /**
   * @function handleTaskDoubleClick
   * A handler for navigating to a task's parent project page on double-click.
   * @param {string} projectId - The ID of the project to navigate to.
   */
  const handleTaskDoubleClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Work Queue</CardTitle>
                <CardDescription>
                  Tasks from in-progress projects that need your attention.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-todo"
                  checked={showToDo}
                  onCheckedChange={setShowToDo}
                />
                <Label htmlFor="show-todo">Show &quot;To Do&quot;</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWorkQueue.map((item) => {
                    const baseTask =
                      item.kind === "full" ? item.task : quickTaskToTask(item.task);
                    const project = projects.find(
                      (p) => p.id === baseTask.projectId,
                    );
                    const categoryIds = project?.categoryIds?.length
                      ? project.categoryIds
                      : project?.categoryId
                        ? [project.categoryId]
                        : [];
                    const projectCategories = categories.filter((cat) =>
                      categoryIds.includes(cat.id),
                    );
                    const totalSubtaskPoints = baseTask.subtasks.reduce(
                      (sum, st) => sum + st.storyPoints,
                      0,
                    );
                    const completedSubtaskPoints = baseTask.subtasks
                      .filter((st) => st.isCompleted)
                      .reduce((sum, st) => sum + st.storyPoints, 0);
                    const linkHref = baseTask.link?.trim() ?? "";
                    const hasLink = linkHref.length > 0;

                    let progress = 0;
                    if (baseTask.status === "Done") {
                      progress = 100;
                    } else if (totalSubtaskPoints > 0) {
                      progress =
                        (completedSubtaskPoints / totalSubtaskPoints) * 100;
                    }

                    if (item.kind === "full") {
                      const task = item.task;
                      return (
                        <TableRow
                          key={task.id}
                          onClick={() => handleFullTaskClick(task)}
                          onDoubleClick={() =>
                            handleTaskDoubleClick(task.projectId)
                          }
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                              />
                              <div className="font-medium flex items-center gap-1">
                                <span>{task.title}</span>
                                {hasLink && (
                                  <a
                                    href={linkHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                      Open linked note
                                    </span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-left font-medium text-primary hover:underline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (project) {
                                    handleTaskDoubleClick(project.id);
                                  }
                                }}
                              >
                                {project?.name}
                              </button>
                              <div className="flex flex-wrap gap-1">
                                {projectCategories
                                  .filter((cat) => cat.id !== "cat-default")
                                  .map((cat) => (
                                    <Badge
                                      key={cat.id}
                                      style={{
                                        backgroundColor: cat.color,
                                      }}
                                      className="text-white"
                                    >
                                      {cat.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{task.status}</TableCell>
                          <TableCell>
                            <Progress value={progress} className="w-[120px]" />
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const quickTask = item.task;
                    const quickProgress = quickTask.status === "Done" ? 100 : 0;

                    return (
                      <TableRow
                        key={quickTask.id}
                        onClick={() => {
                          setSelectedQuickTaskId(quickTask.id);
                          setSelectedTaskId(null);
                        }}
                        onDoubleClick={() => handleTaskDoubleClick(quickTask.projectId)}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${priorityColors[quickTask.priority]}`}
                              />
                              <div className="font-medium flex items-center gap-1">
                                <span
                                  className={cn(
                                    quickTask.status === "Done" &&
                                      "line-through text-muted-foreground",
                                  )}
                                >
                                  {quickTask.title}
                                </span>
                                {hasLink && (
                                  <a
                                    href={linkHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                      Open linked note
                                    </span>
                                  </a>
                                )}
                              </div>
                            </div>
                            {quickTask.description.trim() && (
                              <span className="text-xs text-muted-foreground break-words">
                                {quickTask.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-left font-medium text-primary hover:underline"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (project) {
                                  handleTaskDoubleClick(project.id);
                                }
                              }}
                            >
                              {project?.name}
                            </button>
                            <div className="flex flex-wrap gap-1">
                              {projectCategories
                                .filter((cat) => cat.id !== "cat-default")
                                .map((cat) => (
                                  <Badge
                                    key={cat.id}
                                    style={{
                                      backgroundColor: cat.color,
                                    }}
                                    className="text-white"
                                  >
                                    {cat.name}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{quickTask.status}</TableCell>
                        <TableCell>
                          <Progress value={quickProgress} className="w-[120px]" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <PersonalTodos />
      </div>
      <div className="grid gap-4">
        <Scratchpad />
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(isOpen) => !isOpen && setSelectedTaskId(null)}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onSubtaskChange={updateSubtask}
          onAddSubtask={addSubtask}
          onRemoveSubtask={removeSubtask}
          onAddLog={addLog}
          onUpdateLog={updateLog}
          onDeleteLog={deleteLog}
        />
      )}
      {selectedQuickTask && (
        <QuickTaskDetailDialog
          task={selectedQuickTask}
          open={!!selectedQuickTask}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedQuickTaskId(null);
            }
          }}
          onUpdateTask={updateQuickTask}
          onDeleteTask={(taskId) => {
            deleteQuickTask(taskId);
            setSelectedQuickTaskId(null);
          }}
          onAddLog={addQuickTaskLog}
          onUpdateLog={updateQuickTaskLog}
          onDeleteLog={deleteQuickTaskLog}
        />
      )}
    </>
  );
}
