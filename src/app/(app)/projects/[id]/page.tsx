
"use client";

import { useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DataContext } from "@/context/data-context";
import { Project, Task, Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NotesEditor } from "@/components/projects/notes-editor";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { Pencil } from "lucide-react";

export default function ProjectPage() {
  const { id } = useParams();
  const { projects, tasks, updateProject, updateTask, createTask, deleteTask } =
    useContext(DataContext);
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === id);
    if (currentProject) {
      setProject(currentProject);
      const filteredTasks = tasks.filter((t) => t.projectId === id);
      setProjectTasks(filteredTasks);
    }
  }, [id, projects, tasks]);

  const handleStatusChange = (newStatus: "not started" | "in progress" | "completed") => {
    if (project) {
      const updatedProject = { ...project, status: newStatus };
      updateProject(updatedProject);
      setProject(updatedProject);
    }
  };

  const handleTaskCreated = (newTask: Omit<Task, "id" | "projectId">) => {
    if (project) {
      createTask({ ...newTask, projectId: project.id });
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    updateTask(updatedTask);
    setSelectedTask(null);
  };
  
  const handleTaskDeleted = (taskId: string) => {
    deleteTask(taskId);
    setSelectedTask(null);
  };

  const handleNotesChange = (newNotes: Note[]) => {
    if (project) {
      const updatedProject = { ...project, notes: newNotes };
      updateProject(updatedProject);
      setProject(updatedProject);
    }
  };
  
  const handleProjectUpdated = (updatedProject: Project) => {
    updateProject(updatedProject);
    setProject(updatedProject);
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
              <SelectItem value="not started">Not Started</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <EditProjectDialog project={project} onProjectUpdated={handleProjectUpdated}>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </EditProjectDialog>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <CreateTaskDialog onTaskCreated={handleTaskCreated}>
            <Button>Add Task</Button>
          </CreateTaskDialog>
        </div>
        <TabsContent value="tasks">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer"
                  >
                    <TableCell>{task.name}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <NotesEditor initialNotes={project.notes || []} onNotesChange={handleNotesChange} />
        </TabsContent>
      </Tabs>
      
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onOpenChange={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
