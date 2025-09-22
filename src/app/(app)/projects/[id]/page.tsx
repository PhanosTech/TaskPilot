
"use client";

import { useContext, useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Project, Task, Note, ProjectStatus, TaskStatus, TaskPriority, Subtask } from "@/lib/types";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { NotesTabContent } from "@/components/projects/notes-tab-content";
import { NoteRenderer } from "@/components/projects/note-renderer";
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

const priorityOrder: Record<TaskPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
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
    deleteLog
  } = useContext(DataContext);
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>(['To Do', 'In Progress']);

  // Re-fetch the selected task from the main tasks array whenever it changes.
  // This ensures the dialog always has the latest data.
  const liveSelectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId);
  }, [selectedTaskId, tasks]);
  
  useEffect(() => {
    const currentProject = projects.find((p) => p.id === id);
    if (currentProject) {
      setProject(currentProject);
      const filteredTasks = tasks.filter((t) => t.projectId === id);
      setProjectTasks(filteredTasks);
    }
  }, [id, projects, tasks]);

  const {
    mainNote,
    filteredProjectTasks
  } = useMemo(() => {
    const mainNote = project?.notes.find(n => !n.parentId);
    
    const filteredProjectTasks = projectTasks
      .filter(task => statusFilters.includes(task.status))
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { mainNote, filteredProjectTasks };
  }, [projectTasks, project, statusFilters]);

  /**
   * @function handleStatusFilterChange
   * Toggles the task status filters for the task list.
   * @param {TaskStatus} status - The status to toggle.
   * @param {boolean} checked - The new checked state.
   */
  const handleStatusFilterChange = (status: TaskStatus, checked: boolean) => {
    setStatusFilters(prev => {
      if (checked) {
        return [...prev, status];
      } else {
        return prev.filter(s => s !== status);
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
   * @param {Omit<Task, "id" | "logs">} newTask - The new task data.
   */
  const handleTaskCreated = (newTask: Omit<Task, "id" | "logs">) => {
    createTask(newTask);
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
  const handleSubtaskChange = (taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="tasks">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
               <CreateTaskDialog
                  onTaskCreated={handleTaskCreated}
                  defaultProjectId={project.id}
                />
            </div>
            <TabsContent value="tasks">
               <div className="flex items-center gap-4 my-4">
                  <Label>Filter by status:</Label>
                  {(['To Do', 'In Progress', 'Done'] as TaskStatus[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${status}`}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={(checked) => handleStatusFilterChange(status, !!checked)}
                      />
                      <Label htmlFor={`filter-${status}`}>{status}</Label>
                    </div>
                  ))}
              </div>
              <ScrollArea className="h-[500px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Story Points</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjectTasks.map((task) => {
                      const totalSubtaskPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
                      const completedSubtaskPoints = task.subtasks
                        .filter(st => st.isCompleted)
                        .reduce((sum, st) => sum + st.storyPoints, 0);

                      let progress = 0;
                      if (task.status === 'Done') {
                        progress = 100;
                      } else if (totalSubtaskPoints > 0) {
                        progress = (completedSubtaskPoints / totalSubtaskPoints) * 100;
                      }

                      return (
                        <TableRow
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="cursor-pointer"
                        >
                          <TableCell 
                            className="font-medium hover:underline"
                          >
                            {task.title}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select 
                              value={task.status} 
                              onValueChange={(newStatus: TaskStatus) => updateTask(task.id, { status: newStatus })}
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
                          <TableCell>
                            {task.storyPoints}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                             <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-36 justify-start text-left font-normal",
                                    !task.deadline && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {task.deadline ? format(new Date(task.deadline), "MM/dd/yy") : <span>No date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={task.deadline ? new Date(task.deadline) : undefined}
                                  onSelect={(date) => updateTask(task.id, { deadline: date?.toISOString() })}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <Progress value={progress} className="w-[100px]" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="notes">
              <NotesTabContent initialNotes={project.notes || []} onNotesChange={handleNotesChange} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
           <TasksByStatusChart tasks={projectTasks} />
        </div>
      </div>
      
      {mainNote && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{mainNote.title}</CardTitle>
            <CardDescription>An overview note for this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <NoteRenderer content={mainNote.content} />
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
