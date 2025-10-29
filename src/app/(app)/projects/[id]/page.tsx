"use client";

import { useContext, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  Project,
  Task,
  QuickTask,
  Log,
  Note,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  Subtask,
} from "@/lib/types";
import { TASK_PRIORITY_ORDER } from "@/lib/constants";
import { DataContext } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { NotesTabContent } from "@/components/projects/notes-tab-content";
import { NoteRenderer } from "@/components/projects/note-renderer";
import { QuickTaskDetailDialog } from "@/components/projects/quick-task-detail-dialog";
import { QuickTaskCreateDialog } from "@/components/projects/quick-task-create-dialog";
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart";
import { cn } from "@/lib/utils";
import { quickTaskToTask } from "@/lib/quick-task-utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ExternalLink } from "lucide-react";

const priorityOrder: Record<TaskPriority, number> = TASK_PRIORITY_ORDER;
const statusOrder: Record<TaskStatus, number> = {
  "To Do": 0,
  "In Progress": 1,
  "Done": 2,
};

type CombinedTaskRow =
  | {
      kind: "full";
      task: Task;
      priority: TaskPriority;
      status: TaskStatus;
    }
  | {
      kind: "quick";
      task: QuickTask;
      priority: TaskPriority;
      status: TaskStatus;
    };

/**
 * @page ProjectPage
 * Displays the detailed view for a single project, including its tasks and notes.
 * Allows for editing project details, managing tasks, and interacting with project-specific content.
 */
export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    projects,
    tasks,
    quickTasks,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    updateSubtask,
    addSubtask,
    removeSubtask,
    addLog,
    updateLog,
    deleteLog,
    getProjectQuickTasks,
    createQuickTask,
    updateQuickTask,
    deleteQuickTask,
    addQuickTaskLog,
    updateQuickTaskLog,
    deleteQuickTaskLog,
  } = useContext(DataContext);

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [id, projects],
  );
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [id, tasks],
  );
  const projectQuickTasks = useMemo(() => {
    if (!id) return [] as QuickTask[];
    if (Array.isArray(id)) {
      return getProjectQuickTasks(id[0]);
    }
    return getProjectQuickTasks(id);
  }, [getProjectQuickTasks, id]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedQuickTaskId, setSelectedQuickTaskId] = useState<string | null>(
    null,
  );
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([
    "To Do",
    "In Progress",
  ]);
  const [isQuickTaskCreateOpen, setIsQuickTaskCreateOpen] = useState(false);

  const liveSelectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, tasks]);

  const liveSelectedQuickTask = useMemo(() => {
    if (!selectedQuickTaskId) return null;
    return quickTasks.find((task) => task.id === selectedQuickTaskId) ?? null;
  }, [selectedQuickTaskId, quickTasks]);

  const { mainNote, combinedTaskRows } = useMemo(() => {
    if (!project)
      return { mainNote: null, combinedTaskRows: [] as CombinedTaskRow[] };

    // Prefer an explicitly marked main note (isMain). Fallback to the first top-level note,
    // or the first note in the list if no top-level notes exist. This lets users mark any
    // note as the project's main quick-summary, otherwise we keep using a sensible default.
    const mainNote =
      project.notes.find((n) => n.isMain) ||
      project.notes.find((n) => !n.parentId) ||
      project.notes[0] ||
      null;

    const fullTaskRows: CombinedTaskRow[] = projectTasks
      .filter((task) => statusFilters.includes(task.status))
      .map((task) => ({
        kind: "full" as const,
        task,
        priority: task.priority,
        status: task.status,
      }));

    const quickTaskRows: CombinedTaskRow[] = projectQuickTasks
      .map((task) => ({
        kind: "quick" as const,
        task,
        priority: task.priority,
        status: task.status,
      }))
      .filter((row) => statusFilters.includes(row.status));

    const combinedTaskRows = [...fullTaskRows, ...quickTaskRows].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      if (a.kind !== b.kind) {
        return a.kind === "quick" ? -1 : 1;
      }

      const aText =
        a.kind === "full"
          ? a.task.title.toLowerCase()
          : a.task.title.toLowerCase();
      const bText =
        b.kind === "full"
          ? b.task.title.toLowerCase()
          : b.task.title.toLowerCase();
      return aText.localeCompare(bText);
    });

    return { mainNote, combinedTaskRows };
  }, [projectTasks, projectQuickTasks, project, statusFilters]);

  const chartTasks = useMemo(
    () => [...projectTasks, ...projectQuickTasks.map(quickTaskToTask)],
    [projectTasks, projectQuickTasks],
  );

  /**
   * @function handleStatusFilterChange
   * Toggles the task status filters for the task list.
   * @param {TaskStatus} status - The status to toggle.
   * @param {boolean} checked - The new checked state.
   */
  const handleStatusFilterChange = (status: TaskStatus, checked: boolean) => {
    setStatusFilters((prev) => {
      if (checked) {
        return [...prev, status];
      } else {
        return prev.filter((s) => s !== status);
      }
    });
  };

  /**
   * @function handleStatusChange
   * Updates the project's status.
   * @param {ProjectStatus} newStatus - The new status for the project.
   */
  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (project) {
      updateProject(project.id, { status: newStatus });
    }
  };

  /**
   * @function handleTaskCreated
   * Callback for when a new task is created via the dialog.
   * @param {Omit<Task, "id" | "logs" | "storyPoints">} newTask - The new task data.
   */
  const handleTaskCreated = (
    newTask: Omit<Task, "id" | "logs" | "storyPoints">,
  ) => {
    createTask(newTask);
  };

  /**
   * @function handleQuickTaskCreated
   * Callback for when a new quick task is created from the inline form.
   */
  const handleQuickTaskCreated = (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    points: number;
    link?: string;
    logs: Log[];
  }) => {
    if (!project) return;
    createQuickTask({
      projectId: project.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      points: data.points,
      link: data.link,
      logs: data.logs,
    });
  };

  /**
   * @function handleUpdateTask
   * Callback to update a task's details.
   * @param {string} taskId - The ID of the task to update.
   * @param {Partial<Task>} updatedData - The data to update.
   */
  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
  };

  /**
   * @function handleSubtaskChange
   * Callback to update a subtask.
   * @param {string} taskId - The parent task's ID.
   * @param {string} subtaskId - The subtask's ID.
   * @param {Partial<Subtask>} changes - The changes to apply.
   */
  const handleSubtaskChange = (
    taskId: string,
    subtaskId: string,
    changes: Partial<Subtask>,
  ) => {
    updateSubtask(taskId, subtaskId, changes);
  };

  /**
   * @function handleNotesChange
   * Callback to update the project's notes.
   * @param {Note[]} newNotes - The new array of notes.
   */
  const handleNotesChange = (newNotes: Note[]) => {
    if (project) {
      updateProject(project.id, { notes: newNotes });
    }
  };

  /**
   * @function handleProjectUpdated
   * Callback to update the project's core details.
   * @param {Partial<Project>} data - The updated project data.
   */
  const handleProjectUpdated = (data: Partial<Project>) => {
    if (project) {
      updateProject(project.id, data);
    }
  };

  /**
   * @function handleProjectDeleted
   * Callback to delete the project.
   * @param {string} projectId - The ID of the project to delete.
   */
  const handleProjectDeleted = (projectId: string) => {
    deleteProject(projectId);
    router.push("/projects");
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Backlog">Backlog</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <EditProjectDialog
            project={project}
            onUpdateProject={handleProjectUpdated}
            onDeleteProject={handleProjectDeleted}
          />
        </div>
      </div>

      <div style={{ maxWidth: "calc(100vw - 110px)" }}>
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            <div className="my-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Label>Filter by status:</Label>
                  {(["To Do", "In Progress", "Done"] as TaskStatus[]).map(
                    (status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${status}`}
                          checked={statusFilters.includes(status)}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange(status, !!checked)
                          }
                        />
                        <Label htmlFor={`filter-${status}`}>{status}</Label>
                      </div>
                    ),
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <CreateTaskDialog
                    onTaskCreated={handleTaskCreated}
                    defaultProjectId={project.id}
                  />
                  <Button onClick={() => setIsQuickTaskCreateOpen(true)}>
                    Add Quick Task
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
              <div className="lg:col-span-2">
                <ScrollArea className="h-[500px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedTaskRows.map((row) => {
                        if (row.kind === "full") {
                          const { task } = row;
                          const totalSubtaskPoints = task.subtasks.reduce(
                            (sum, st) => sum + st.storyPoints,
                            0,
                          );
                          const completedSubtaskPoints = task.subtasks
                            .filter((st) => st.isCompleted)
                            .reduce((sum, st) => sum + st.storyPoints, 0);
                          const linkHref = task.link?.trim() ?? "";
                          const hasLink = linkHref.length > 0;

                          let progress = 0;
                          if (task.status === "Done") {
                            progress = 100;
                          } else if (totalSubtaskPoints > 0) {
                            progress =
                              (completedSubtaskPoints / totalSubtaskPoints) *
                              100;
                          }

                          return (
                            <TableRow
                              key={`full-${task.id}`}
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setSelectedQuickTaskId(null);
                              }}
                              className="cursor-pointer"
                            >
                              <TableCell className="font-medium hover:underline">
                                <div className="flex items-center gap-1.5">
                                  <span>{task.title}</span>
                                  {hasLink && (
                                    <a
                                      href={linkHref}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Open linked note
                                      </span>
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={task.status}
                                  onValueChange={(newStatus: TaskStatus) =>
                                    updateTask(task.id, { status: newStatus })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="To Do">To Do</SelectItem>
                                    <SelectItem value="In Progress">
                                      In Progress
                                    </SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{task.storyPoints}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-36 justify-start text-left font-normal",
                                        !task.deadline && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {task.deadline ? (
                                        format(
                                          new Date(task.deadline),
                                          "MM/dd/yy",
                                        )
                                      ) : (
                                        <span>No date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={
                                        task.deadline
                                          ? new Date(task.deadline)
                                          : undefined
                                      }
                                      onSelect={(date) =>
                                        updateTask(task.id, {
                                          deadline: date?.toISOString(),
                                        })
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              <TableCell>
                                <Progress
                                  value={progress}
                                  className="w-[100px]"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        }

                        const quickTask = row.task;
                        const linkHref = quickTask.link?.trim() ?? "";
                        const hasLink = linkHref.length > 0;
                        const progress = quickTask.status === "Done" ? 100 : 0;

                        return (
                          <TableRow
                            key={`quick-${quickTask.id}`}
                            onClick={() => {
                              setSelectedQuickTaskId(quickTask.id);
                              setSelectedTaskId(null);
                            }}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium hover:underline">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      quickTask.status === "Done" &&
                                        "line-through text-muted-foreground",
                                    )}
                                  >
                                    {quickTask.title}
                                  </span>
                                  <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">
                                    Quick
                                  </Badge>
                                  {hasLink && (
                                    <a
                                      href={linkHref}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Open linked note
                                      </span>
                                    </a>
                                  )}
                                </div>
                                {quickTask.description.trim() && (
                                  <span className="text-xs text-muted-foreground break-words">
                                    {quickTask.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell onClick={(event) => event.stopPropagation()}>
                              <Select
                                value={quickTask.status}
                                onValueChange={(newStatus: TaskStatus) =>
                                  updateQuickTask(quickTask.id, {
                                    status: newStatus,
                                    isDone: newStatus === "Done",
                                  })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="To Do">To Do</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{quickTask.points}</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>
                              <Progress value={progress} className="w-[100px]" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              <div className="lg:col-span-1">
                <TasksByStatusChart tasks={chartTasks} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="notes">
            <div className="w-full">
              <NotesTabContent
                initialNotes={project.notes || []}
                onNotesChange={handleNotesChange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {mainNote && (
        <Card className="mt-8" style={{ maxWidth: "calc(100vw - 110px)" }}>
          <CardHeader>
            <CardTitle>{mainNote.title}</CardTitle>
            <CardDescription>
              An overview note for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoteRenderer content={mainNote.content} />
          </CardContent>
        </Card>
      )}

      <QuickTaskCreateDialog
        open={isQuickTaskCreateOpen}
        onOpenChange={setIsQuickTaskCreateOpen}
        onCreate={handleQuickTaskCreated}
      />

      {liveSelectedTask && (
        <TaskDetailDialog
          task={liveSelectedTask}
          open={!!liveSelectedTask}
          onOpenChange={(isOpen) => !isOpen && setSelectedTaskId(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={deleteTask}
          onSubtaskChange={handleSubtaskChange}
          onAddSubtask={addSubtask}
          onRemoveSubtask={removeSubtask}
          onAddLog={addLog}
          onUpdateLog={updateLog}
          onDeleteLog={deleteLog}
        />
      )}
      {liveSelectedQuickTask && (
        <QuickTaskDetailDialog
          task={liveSelectedQuickTask}
          open={!!liveSelectedQuickTask}
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
    </div>
  );
}
