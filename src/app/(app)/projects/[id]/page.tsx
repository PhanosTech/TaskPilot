
"use client";

import { useContext, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataContext } from "@/context/data-context";
import { Project, Task, Note, ProjectStatus } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === id);
    if (currentProject) {
      setProject(currentProject);
      const filteredTasks = tasks.filter((t) => t.projectId === id);
      setProjectTasks(filteredTasks);
    }
  }, [id, projects, tasks]);

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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTasks.map((task) => {
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
                      onClick={() => setSelectedTask(task)}
                      className="cursor-pointer"
                    >
                      <TableCell>{task.title}</TableCell>
                      <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                      <TableCell>{task.priority}</TableCell>
                      <TableCell>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
                      </TableCell>
                       <TableCell>
                        <Progress value={progress} className="w-[100px]" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <NotesTabContent initialNotes={project.notes || []} onNotesChange={handleNotesChange} />
        </TabsContent>
      </Tabs>
      
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
