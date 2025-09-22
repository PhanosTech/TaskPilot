
"use client";

import { useMemo, useState, useContext } from "react";
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
import { Calendar, MessageSquare, Star } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * @interface KanbanCardProps
 * Props for the KanbanCard component.
 */
interface KanbanCardProps {
  /** The task object to display in the card. */
  task: Task;
  /** Callback function to handle double-clicking the card, typically to open a detail view. */
  onDoubleClick: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    High: "bg-red-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
};

/**
 * @component KanbanCard
 * Represents a single task card on the Kanban board.
 * It is draggable and displays key information about the task.
 * @param {KanbanCardProps} props - The component props.
 */
export function KanbanCard({ task, onDoubleClick }: KanbanCardProps) {
    const [isDragging, setIsDragging] = useState(false);
    
    const progress = useMemo(() => {
        if (task.status === 'Done') return 100;
        
        const totalSubtaskPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
        if (totalSubtaskPoints === 0) return 0;
        
        const completedSubtaskPoints = task.subtasks
            .filter(st => st.isCompleted)
            .reduce((sum, st) => sum + st.storyPoints, 0);

        return (completedSubtaskPoints / totalSubtaskPoints) * 100;
    }, [task.subtasks, task.status]);
    
    /**
     * @function handleDragStart
     * Sets the task ID in the data transfer object when dragging starts.
     * @param {React.DragEvent<HTMLDivElement>} e - The drag event.
     */
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("taskId", task.id);
      setIsDragging(true);
    };

    /**
     * @function handleDragEnd
     * Resets the dragging state when the drag operation ends.
     */
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
                    onDoubleClick={onDoubleClick}
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
        </>
    );
}
