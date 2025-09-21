
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
import type { Task, TaskPriority, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * @interface KanbanCardProps
 * Props for the KanbanCard component.
 */
interface KanbanCardProps {
  /** The task object to display. */
  task: Task;
  /** 
   * Callback function for when the task's status changes.
   * @param {Task['status']} newStatus - The new status.
   */
  onStatusChange: (newStatus: Task['status']) => void;
  /** Callback function for when the card is double-clicked, typically to open a detail view. */
  onDoubleClick: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    High: "bg-red-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
};

/**
 * @component KanbanCard
 * A card component that represents a single task on the Kanban board.
 * It is draggable and displays key task information.
 * @param {KanbanCardProps} props - The component props.
 * @returns {JSX.Element} The rendered task card.
 */
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
    
    const [selectedTask, setSelectedTask] = useState(task);

    // Update internal state if the task prop changes
    useMemo(() => {
        setSelectedTask(task);
    }, [task]);


    const progress = useMemo(() => {
        if (task.status === 'Done') return 100;
        const totalPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
        if (totalPoints === 0) return 0;
        
        const completedPoints = task.subtasks
            .filter(st => st.isCompleted)
            .reduce((sum, st) => sum + st.storyPoints, 0);

        return (completedPoints / totalPoints) * 100;
    }, [task.subtasks, task.status]);
    
    /**
     * Handles the start of a drag operation.
     * @param {React.DragEvent<HTMLDivElement>} e - The drag event.
     */
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("taskId", task.id);
      setIsDragging(true);
    };

    /**
     * Handles the end of a drag operation.
     */
    const handleDragEnd = () => {
      setIsDragging(false);
    };
    
    /**
     * Generic handler for updating the selected task.
     * @param {string} taskId - The ID of the task to update.
     * @param {Partial<Task>} updatedData - The data to update.
     */
    const handleUpdateTask = (taskId: string, updatedData: Partial<Task>) => {
        updateTask(taskId, updatedData);
        setSelectedTask(prev => ({ ...prev, ...updatedData }));
    };

    /**
     * Generic handler for updating a subtask.
     * @param {string} taskId - The ID of the parent task.
     * @param {string} subtaskId - The ID of the subtask.
     * @param {Partial<Subtask>} changes - The changes to apply.
     */
    const handleSubtaskChange = (taskId: string, subtaskId: string, changes: Partial<Subtask>) => {
        updateSubtask(taskId, subtaskId, changes);
        setSelectedTask(prev => ({
            ...prev,
            subtasks: prev.subtasks.map(st => st.id === subtaskId ? { ...st, ...changes } : st)
        }));
    };

    /**
     * Generic handler for adding a subtask.
     * @param {string} taskId - The ID of the parent task.
     * @param {string} title - The title of the new subtask.
     * @param {number} storyPoints - The story points for the new subtask.
     */
    const handleAddSubtask = (taskId: string, title: string, storyPoints: number) => {
        // We can't know the new subtask's ID here, so we rely on the context to update the main state
        // and the updated task will flow back down through props.
        addSubtask(taskId, title, storyPoints);
    };

    /**
     * Generic handler for removing a subtask.
     * @param {string} taskId - The ID of the parent task.
     * @param {string} subtaskId - The ID of the subtask to remove.
     */
    const handleRemoveSubtask = (taskId: string, subtaskId: string) => {
        removeSubtask(taskId, subtaskId);
        setSelectedTask(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
        }));
    };
    
    // Similar handlers for logs
    const handleAddLog = (taskId: string, content: string) => addLog(taskId, content);
    const handleUpdateLog = (taskId: string, logId: string, content: string) => updateLog(taskId, logId, content);
    const handleDeleteLog = (taskId: string, logId: string) => deleteLog(taskId, logId);


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
                            <Badge variant="outline">{task.projectId}</Badge>
                        </div>
                        <CardTitle className="text-base pt-1">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                       <div className="flex space-x-2 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                               <Calendar className="h-4 w-4" />
                               <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}</span>
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
                  task={selectedTask}
                  onUpdateTask={handleUpdateTask}
                  onSubtaskChange={handleSubtaskChange}
                  onAddSubtask={handleAddSubtask}
                  onRemoveSubtask={handleRemoveSubtask}
                  onAddLog={handleAddLog}
                  onUpdateLog={handleUpdateLog}
                  onDeleteLog={handleDeleteLog}
              />
            )}
        </>
    );
}
