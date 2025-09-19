
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/data";
import { MoreHorizontal, Calendar, MessageSquare, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Progress } from "../ui/progress";
import { useContext } from "react";
import { DataContext } from "@/context/data-context";

interface KanbanCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDoubleClick: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

const availableStatuses: TaskStatus[] = ["To Do", "In Progress", "Done"];

export function KanbanCard({ task, onStatusChange, onDoubleClick }: KanbanCardProps) {
  const { projects } = useContext(DataContext);
  const project = projects.find((p) => p.id === task.projectId);
  
  const totalSubtaskPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
  const completedSubtaskPoints = task.subtasks
    .filter((st) => st.isCompleted)
    .reduce((sum, st) => sum + st.storyPoints, 0);

  let progress = 0;
  if (task.status === 'Done') {
    progress = 100;
  } else if (totalSubtaskPoints > 0) {
    progress = (completedSubtaskPoints / totalSubtaskPoints) * 100;
  }

  return (
    <Card className="hover:shadow-md transition-shadow" onDoubleClick={onDoubleClick}>
      <CardHeader className="p-3">
        <div className="flex items-start justify-between">
            <Badge variant="outline">{project?.name}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableStatuses
                  .filter((status) => status !== task.status)
                  .map((status) => (
                    <DropdownMenuItem key={status} onSelect={() => onStatusChange(task.id, status)}>
                      Move to {status}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                       <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{task.priority} Priority</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {task.storyPoints}
            </Badge>
        </div>
        {task.subtasks.length > 0 && <Progress value={progress} className="h-2 flex-1" />}
      </CardFooter>
    </Card>
  );
}
