
"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority, Subtask } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * @interface TaskDetailDialogProps
 * Props for the TaskDetailDialog component.
 */
interface TaskDetailDialogProps {
  /** The task object to display and edit. */
  task: Task;
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Callback function for when the dialog's open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Callback to update a task with new data. */
  onUpdateTask: (taskId: string, updatedData: Partial<Task>) => void;
  /** Callback for when a subtask's completion status changes. */
  onSubtaskChange: (taskId: string, subtaskId: string, isCompleted: boolean) => void;
  /** Callback to add a new subtask to the current task. */
  onAddSubtask: (taskId: string, subtaskTitle: string, storyPoints: number) => void;
  /** Callback to remove a subtask from the current task. */
  onRemoveSubtask: (taskId: string, subtaskId: string) => void;
  /** Callback to add a new work log to the current task. */
  onAddLog: (taskId: string, logContent: string) => void;
}

/**
 * @component TaskDetailDialog
 * A dialog for viewing and editing the details of a task, including its subtasks and work logs.
 * @param {TaskDetailDialogProps} props - The component props.
 */
export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  onSubtaskChange,
  onAddSubtask,
  onRemoveSubtask,
  onAddLog,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [deadline, setDeadline] = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : new Date()
  );
  const [storyPoints, setStoryPoints] = useState(task.storyPoints);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks);
  
  const [newLog, setNewLog] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskPoints, setNewSubtaskPoints] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDeadline(task.deadline ? new Date(task.deadline) : new Date());
      setStoryPoints(task.storyPoints);
      setSubtasks(task.subtasks);
    }
  }, [open, task]);

  const completedSubtasks = subtasks.filter(st => st.isCompleted).length;
  const totalStoryPoints = subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
  const completedStoryPoints = subtasks.filter(st => st.isCompleted).reduce((sum, st) => sum + st.storyPoints, 0);

  const handleSaveChanges = () => {
    if (!deadline) {
      toast({
        title: "Invalid Date",
        description: "Please select a deadline.",
        variant: "destructive",
      });
      return;
    }

    let points = storyPoints;
    if (points < 1) points = 1;
    if (points > 10) points = 10;
    
    onUpdateTask(task.id, { 
      title, 
      description, 
      status,
      priority,
      deadline: deadline.toISOString(),
      storyPoints: points,
      subtasks,
    });
    toast({
      title: "Task Updated",
      description: "Your changes have been saved.",
    });
    onOpenChange(false);
  };

  const handleAddLog = () => {
    if (newLog.trim()) {
      onAddLog(task.id, newLog.trim());
      setNewLog("");
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim(), newSubtaskPoints);
      setNewSubtaskTitle("");
      setNewSubtaskPoints(0);
    }
  };

  const handleSubtaskFieldChange = (subtaskId: string, field: 'title' | 'storyPoints', value: string | number) => {
    setSubtasks(prev => prev.map(st => st.id === subtaskId ? {...st, [field]: value} : st));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
             <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
          </DialogTitle>
          <DialogDescription>
             <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." />
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="flex flex-col space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Set priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Story Points</Label>
                    <Input type="number" min="1" max="10" value={storyPoints} onChange={(e) => setStoryPoints(Number(e.target.value))} />
                </div>
                 <div className="flex flex-col space-y-2">
                    <Label>Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={setDeadline}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
            </div>
          
            <div>
                <h3 className="mb-2 font-semibold">
                    Subtasks ({completedSubtasks}/{subtasks.length}) - {completedStoryPoints}/{totalStoryPoints} pts
                </h3>
                <div className="space-y-2">
                    {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center space-x-2 group">
                            <Checkbox
                                id={`subtask-${subtask.id}`}
                                checked={subtask.isCompleted}
                                onCheckedChange={(checked) =>
                                  onSubtaskChange(task.id, subtask.id, !!checked)
                                }
                            />
                            <Input
                                value={subtask.title}
                                onChange={(e) => handleSubtaskFieldChange(subtask.id, 'title', e.target.value)}
                                className={`flex-1 ${subtask.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            />
                             <Input
                                type="number"
                                value={subtask.storyPoints}
                                onChange={(e) => handleSubtaskFieldChange(subtask.id, 'storyPoints', Number(e.target.value))}
                                className="w-20"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => onRemoveSubtask(task.id, subtask.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    <Input 
                      placeholder="Add a new subtask" 
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                    />
                    <Input
                      type="number"
                      placeholder="Pts"
                      className="w-20"
                      value={newSubtaskPoints}
                      onChange={(e) => setNewSubtaskPoints(Number(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                    />
                    <Button type="button" onClick={handleAddSubtask}>Add</Button>
                  </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold">Work Logs</h3>
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                {task.logs.slice().reverse().map(log => (
                  <div key={log.id} className="text-sm text-muted-foreground">
                   <p className="font-medium text-foreground">{log.content}</p>
                   <p>{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {task.logs.length === 0 && <p className="text-sm text-muted-foreground">No logs yet.</p>}
              </div>

              <div className="space-y-2">
                 <Textarea 
                    placeholder="Add a new work log..."
                    value={newLog}
                    onChange={(e) => setNewLog(e.target.value)}
                 />
                 <Button onClick={handleAddLog} disabled={!newLog.trim()}>Add Log</Button>
              </div>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
