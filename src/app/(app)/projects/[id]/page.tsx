
"use client";

import { useState, use, useMemo, useContext, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TasksByStatusChart } from "@/components/charts/tasks-by-status-chart";
import type { Task, TaskPriority, Note, ProjectStatus, Project, TaskStatus } from "@/lib/types";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { NotesEditor } from "@/components/projects/notes-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DataContext } from "@/context/data-context";
import { ListFilter } from "lucide-react";

// Dynamically import client-only components
const NoteRenderer = dynamic(() => import("@/components/projects/note-renderer").then(mod => mod.NoteRenderer), { ssr: false });

const priorityColors: Record<TaskPriority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

type StatusFilter = TaskStatus | "All";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    projects, 
    getProjectTasks, 
    updateProject, 
    deleteProject, 
    createTask, 
    updateTask, 
    addSubtask, 
    removeSubtask, 
    addLog 
  } = useContext(DataContext);
  
  const [project, setProject] = useState<Project | undefined>(() => 
    projects.find((p) => p.id === id)
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("In Progress");

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === id);
    if (!currentProject) {
      const timer = setTimeout(() => router.push('/projects'), 50);
      return () => clearTimeout(timer);
    } else {
      setProject(currentProject);
    }
  }, [projects, id, router]);

  const tasks = useMemo(() => getProjectTasks(id), [getProjectTasks, id]);
  
  const filteredTasks = useMemo(() => {
    if (statusFilter === "All") {
      return tasks;
    }
    return tasks.filter(task => task.status === statusFilter);
  }, [tasks, statusFilter]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!project) {
    return <div>Loading project or redirecting...</div>;
  }

  const mainNote = useMemo(() => {
    const topLevelNotes = project.notes?.filter(n => !n.parentId);
    if (topLevelNotes && topLevelNotes.length > 0) {
      return topLevelNotes[0];
    }
    return {
      id: "main",
      title: "Main",
      content: "",
    };
  }, [project.notes]);

  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'projectId' | 'status' | 'logs'>) => {
    createTask(project.id, newTaskData);
  };

  const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
    updateTask(taskId, updatedData);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prevSelectedTask =>
        prevSelectedTask ? { ...prevSelectedTask, ...updatedData } : null
      );
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
  
  const handleAddSubtask = (taskId: string, subtaskTitle: string, storyPoints: number) => {
    addSubtask(taskId, subtaskTitle, storyPoints);
  };
  
  const handleRemoveSubtask = (taskId: string, subtaskId: string) => {
    removeSubtask(taskId, subtaskId);
  };

  const handleAddLog = (taskId: string, logContent: string) => {
    addLog(taskId, logContent);
  };

  const handleNotesChange = (newNotes: Note[]) => {
    updateProject(id, { notes: newNotes });
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(id, { status: newStatus });
  };
  
  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
  };

  const handleUpdateProject = (updatedData: Partial<Project>) => {
    updateProject(project.id, updatedData);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-48">
            <Select value={project.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Set project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <EditProjectDialog 
            project={project}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <CreateTaskDialog onCreateTask={handleCreateTask} defaultProjectId={id} />
        </div>
        <TabsContent value="tasks">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
              <Card className="col-span-4 lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>All tasks associated with this project.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="hidden md:table-cell">Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => {
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
                          <TableRow key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                                <div className="font-medium">{task.title}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{task.storyPoints}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Progress value={progress} className="w-[100px]" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="col-span-4 lg:col-span-3 flex flex-col gap-4">
                <TasksByStatusChart tasks={tasks} />
              </div>
            </div>
             {mainNote && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>{mainNote.title}</CardTitle>
                  <CardDescription>Main project note. Edit in the 'Notes' tab.</CardDescription>
                </CardHeader>
                <CardContent>
                  <NoteRenderer content={mainNote.content} />
                </CardContent>
              </Card>
            )}
        </TabsContent>
        <TabsContent value="notes">
          <NotesEditor 
            initialNotes={project.notes || []}
            onNotesChange={handleNotesChange}
          />
        </TabsContent>
      </Tabs>
      
      {selectedTask && (
        <TaskDetailDialog 
          task={selectedTask} 
          open={!!selectedTask} 
          onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onSubtaskChange={handleSubtaskChange}
          onAddSubtask={handleAddSubtask}
          onRemoveSubtask={handleRemoveSubtask}
          onAddLog={addLog}
        />
      )}
    </div>
  );
}
