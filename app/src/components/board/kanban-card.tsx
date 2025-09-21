
"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { DataContext } from "@/context/data-context";
import { useContext } from "react";
import { Calendar, MessageSquare, Star } from "lucide-react";
import type { Task, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: Task;
  onStatusChange: (newStatus: Task['status']) => void;
  onDoubleClick: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    High: "bg-red-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
};

export function KanbanCard({ task, onDoubleClick }: KanbanCardProps) {
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { 
      updateTask, 
      addSubtask, 
      removeSubtask, 
      addLog,
      updateLog,
      deleteLog,
      updateSubtask,
    } = useContext(DataContext);


    const progress = useMemo(() => {
        if (task.status === 'Done') return 100;
        if (task.subtasks.length === 0) return 0;

        const completedSubtasks = task.subtasks.filter(st => st.isCompleted);
        return (completedSubtasks.length / task.subtasks.length) * 100;
    }, [task.subtasks, task.status]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("taskId", task.id);
      setIsDragging(true);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    return (
        <>
            <TooltipProvider>
                <Card 
                    className={cn(
                        "mb-4 cursor-pointer hover:shadow-lg transition-all",
                        isDragging && "opacity-50 scale-105 shadow-xl"
                    )}
                    onDoubleClick={() => setIsDetailViewOpen(true)}
                    draggable="true"
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <CardHeader className="p-3">
                        <div className="flex justify-between items-center">
                            <Badge variant="outline">{task.status}</Badge>
                        </div>
                        <CardTitle className="text-base pt-1">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                       <div className="flex space-x-2 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                               <Calendar className="h-4 w-4" />
                               <span>{new Date(task.deadline).toLocaleDateString()}</span>
                           </div>
                           {task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}</span>
                              </div>
                           )}
                       </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                          <Tooltip>
                              <TooltipTrigger>
                                <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{task.priority} Priority</p>
                              </TooltipContent>
                          </Tooltip>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {task.storyPoints}
                        </Badge>
                    </div>
                    {task.subtasks.length > 0 && <Progress value={progress} className="h-2 flex-1" />}
                  </CardFooter>
                </Card>
            </TooltipProvider>
            {isDetailViewOpen && (
              <TaskDetailDialog
                  open={isDetailViewOpen}
                  onOpenChange={setIsDetailViewOpen}
                  task={task}
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
