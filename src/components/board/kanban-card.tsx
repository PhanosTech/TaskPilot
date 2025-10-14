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
import { Calendar, MessageSquare, Star, ExternalLink } from "lucide-react";
import type { Task, TaskPriority, ProjectCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * @interface KanbanCardProps
 * Props for the KanbanCard component.
 */
interface KanbanCardProps {
  /** The task object to display in the card. */
  task: Task;
  /** The name of the project this task belongs to. */
  projectName: string;
  /** The categories assigned to the project. */
  categories: ProjectCategory[];
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
export function KanbanCard({
  task,
  projectName,
  categories,
  onDoubleClick,
}: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const progress = useMemo(() => {
    if (task.status === "Done") return 100;

    const totalSubtaskPoints = task.subtasks.reduce(
      (sum, st) => sum + st.storyPoints,
      0,
    );
    if (totalSubtaskPoints === 0) return 0;

    const completedSubtaskPoints = task.subtasks
      .filter((st) => st.isCompleted)
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
            "mb-2 cursor-pointer hover:shadow-lg transition-all",
            isDragging && "opacity-50 scale-105 shadow-xl",
          )}
          onDoubleClick={onDoubleClick}
          draggable="true"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <CardHeader className="p-3 pb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs font-medium text-muted-foreground truncate pr-2">
                {projectName}
              </p>
              <div className="flex flex-wrap gap-1 justify-end">
                {categories
                  .filter((cat) => cat.id !== "cat-default")
                  .map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="outline"
                      style={{
                        borderColor: cat.color,
                        color: cat.color,
                      }}
                      className="text-xs"
                    >
                      {cat.name}
                    </Badge>
                  ))}
              </div>
            </div>
            <CardTitle className="text-base pt-0 flex items-center gap-2">
              <span>{task.title}</span>
              {task.link?.trim() && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open linked note</span>
                </a>
              )}
            </CardTitle>
          </CardHeader>

          <CardFooter className="p-3 pt-0 flex flex-col items-start gap-3">
            <div className="w-full">
              {task.subtasks.length > 0 && (
                <Progress value={progress} className="h-2 w-full" />
              )}
            </div>
            <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
                {task.subtasks.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>
                      {task.subtasks.filter((st) => st.isCompleted).length}/
                      {task.subtasks.length}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.priority} Priority</p>
                  </TooltipContent>
                </Tooltip>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-1.5 py-0.5 text-xs"
                >
                  <Star className="h-3 w-3" />
                  {task.storyPoints}
                </Badge>
              </div>
            </div>
          </CardFooter>
        </Card>
      </TooltipProvider>
    </>
  );
}
