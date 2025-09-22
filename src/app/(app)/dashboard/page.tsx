
"use client";

import { useState, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskPriority } from "@/lib/types";
import { DataContext } from "@/context/data-context";
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

const priorityColors: Record<TaskPriority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

const priorityOrder: Record<TaskPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/**
 * @page DashboardPage
 * The main dashboard of the application, providing a high-level overview of projects and tasks.
 * It includes summary statistics, an active work queue, personal todos, and a scratchpad.
 */
export default function DashboardPage() {
  const { 
    projects, 
    tasks, 
    updateTask, 
    updateSubtask,
    addSubtask, 
    removeSubtask, 
    addLog,
    updateLog,
    deleteLog,
  } = useContext(DataContext);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showToDo, setShowToDo] = useState(false);
  const router = useRouter();
  
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  const totalProjects = projects.length;
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline || 0) < new Date() && t.status !== 'Done').length;

  const activeWorkQueue = useMemo(() => {
    const inProgressProjects = projects.filter(p => p.status === 'In Progress');
    const statusesToShow: ("To Do" | "In Progress")[] = ["In Progress"];
    if (showToDo) {
      statusesToShow.push("To Do");
    }
    return tasks
      .filter(t => 
        inProgressProjects.some(p => p.id === t.projectId) && statusesToShow.includes(t.status)
      )
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [projects, tasks, showToDo]);

  /**
   * @function handleTaskClick
   * A handler to select a task and open its detail view.
   * @param {Task} task - The task that was clicked.
   */
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksInProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>
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
                <Switch id="show-todo" checked={showToDo} onCheckedChange={setShowToDo} />
                <Label htmlFor="show-todo">Show "To Do"</Label>
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
                  {activeWorkQueue.map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
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
                        onClick={() => handleTaskClick(task)} 
                        onDoubleClick={() => handleTaskDoubleClick(task.projectId)}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                            <div className="font-medium">{task.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>{project?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.status}</Badge>
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
          onSubtaskChange={updateSubtask}
          onAddSubtask={addSubtask}
          onRemoveSubtask={removeSubtask}
          onAddLog={addLog}
          onUpdateLog={updateLog}
          onDeleteLog={deleteLog}
        />
      )}
    </>
  );
}
