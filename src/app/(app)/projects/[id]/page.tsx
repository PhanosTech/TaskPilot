
"use client";

import { useContext, useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataContext } from "@/context/data-context";
import { Project, Task, Note, ProjectStatus, TaskStatus } from "@/lib/types";
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
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { NotesTabContent } from "@/components/projects/notes-tab-content";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteRenderer } from "@/components/projects/note-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    projects, 
    tasks, 
    updateProject, 
    deleteProject, 
    updateTask, 
    createTask, 
    deleteTask,
    addSubtask,
    removeSubtask,
    addLog,
  } = useContext(DataContext);
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>(['To Do', 'In Progress']);

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
    
    const filteredProjectTasks = projectTasks.filter(task => statusFilters.includes(task.status));

    return { mainNote, filteredProjectTasks };
  }, [projectTasks, project, statusFilters]);

  const handleStatusFilterChange = (status: TaskStatus, checked: boolean) => {
    setStatusFilters(prev => {
      if (checked) {
        return [...prev, status];
      } else {
        return prev.filter(s => s !== status);
      }
    });
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (project) {
      updateProject(project.id, { status: newStatus });
    }
  };

  const handleTaskCreated = (newTask: Omit<Task, "id" | "logs">) => {
    createTask(newTask);
  };

  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {...prev, ...updatedData} : null);
    }
  };
  
  const handleSubtaskChange = (taskId: string, subtaskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask
    );
    updateTask(taskId, { subtasks: newSubtasks });
  };
  
  const handleNotesChange = (newNotes: Note[]) => {
    if (project) {
      updateProject(project.id, { notes: newNotes });
    }
  };
  
  const handleProjectUpdated = (data: Partial<Project>) => {
    if (project) {
      updateProject(project.id, data);
    }
  };
  
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
              <CreateTaskDialog onTaskCreated={handleTaskCreated} defaultProjectId={project.id}>
                <Button>Add Task</Button>
              </CreateTaskDialog>
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
                        >
                          <TableCell 
                            onClick={() => setSelectedTask(task)}
                            className="cursor-pointer font-medium hover:underline"
                          >
                            {task.title}
                          </TableCell>
                          <TableCell>
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
                          <TableCell onClick={() => setSelectedTask(task)} className="cursor-pointer">
                            {task.storyPoints}
                          </TableCell>
                          <TableCell>
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
                          <TableCell onClick={() => setSelectedTask(task)} className="cursor-pointer">
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

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onSubtaskChange={handleSubtaskChange}
          onAddSubtask={addSubtask}
          onRemoveSubtask={removeSubtask}
          onAddLog={addLog}
        />
      )}
    </div>
  );
}
