
"use client";

import { useState, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { DataContext } from "@/context/data-context";
import type { Task, TaskPriority } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function DashboardPage() {
  const { 
    projects, 
    tasks, 
    updateTask, 
    addSubtask, 
    removeSubtask, 
    addLog 
  } = useContext(DataContext);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showToDo, setShowToDo] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState("");
  const router = useRouter();

  // Load scratchpad from localStorage on initial render
  useEffect(() => {
    const savedContent = localStorage.getItem("taskpilot-scratchpad");
    if (savedContent) {
      setScratchpadContent(savedContent);
    }
  }, []);

  // Save scratchpad to localStorage on change
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("taskpilot-scratchpad", scratchpadContent);
    }, 500); // Debounce to avoid excessive writes
    return () => clearTimeout(handler);
  }, [scratchpadContent]);

  const totalProjects = projects.length;
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Done').length;

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

  // State for Personal Todos
  const [personalTodos, setPersonalTodos] = useState([
    { id: 1, text: "Follow up on client feedback", completed: false, status: "in-progress" },
    { id: 2, text: "Schedule team meeting", completed: false, status: "in-progress" },
    { id: 3, text: "Draft Q3 report", completed: true, status: "backlog" },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const handleAddTodo = () => {
    if (newTodo.trim() !== "") {
      setPersonalTodos([...personalTodos, { id: Date.now(), text: newTodo, completed: false, status: "in-progress" }]);
      setNewTodo("");
    }
  };

  const handleToggleTodo = (id: number) => {
    setPersonalTodos(personalTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleUpdateTodoStatus = (id: number, status: "in-progress" | "backlog") => {
    setPersonalTodos(personalTodos.map(todo => 
      todo.id === id ? { ...todo, status } : todo
    ));
  };
  
  const handleDeleteTodo = (id: number) => {
    setPersonalTodos(personalTodos.filter(todo => todo.id !== id));
  };


  const handleSubtaskChange = (taskId: string, subtaskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask
    );
    updateTask(taskId, { subtasks: newSubtasks });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

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
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Personal Todos</CardTitle>
            <CardDescription>Quick reminders and tasks not tied to a project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
              <Input 
                type="text" 
                placeholder="Add a new todo" 
                value={newTodo} 
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              />
              <Button type="submit" onClick={handleAddTodo}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
            <Tabs defaultValue="in-progress">
              <TabsList>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="backlog">Backlog</TabsTrigger>
              </TabsList>
              <TabsContent value="in-progress">
                {personalTodos.filter(t => t.status === 'in-progress').map(todo => (
                  <div key={todo.id} className="flex items-center space-x-2 my-2 group">
                    <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                    >
                      {todo.text}
                    </label>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateTodoStatus(todo.id, "backlog")} className="opacity-0 group-hover:opacity-100">Move to Backlog</Button>
                    <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTodo(todo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="backlog">
                {personalTodos.filter(t => t.status === 'backlog').map(todo => (
                  <div key={todo.id} className="flex items-center space-x-2 my-2 group">
                    <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                    >
                      {todo.text}
                    </label>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateTodoStatus(todo.id, "in-progress")} className="opacity-0 group-hover:opacity-100">Move to In Progress</Button>
                     <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTodo(todo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
            <CardHeader>
              <CardTitle>Scratchpad</CardTitle>
              <CardDescription>A simple notepad for quick thoughts. Saved automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Jot down anything..."
                className="h-48 resize-none"
                value={scratchpadContent}
                onChange={(e) => setScratchpadContent(e.target.value)}
              />
            </CardContent>
          </Card>
      </div>
          {selectedTask && (
            <TaskDetailDialog 
              task={selectedTask} 
              open={!!selectedTask} 
              onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}
              onUpdateTask={updateTask}
              onSubtaskChange={handleSubtaskChange}
              onAddSubtask={addSubtask}
              onRemoveSubtask={removeSubtask}
              onAddLog={addLog}
            />
          )}
        </>
      )
    }

    

    

    