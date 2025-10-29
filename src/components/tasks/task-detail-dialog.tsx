
"use client";

import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import type { Task, TaskStatus, TaskPriority, Subtask, Log } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Calendar as CalendarIcon, X, Edit2, Trash2, ExternalLink } from "lucide-react";
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
  /** Callback to delete a task. */
  onDeleteTask: (taskId: string) => void;
  /** Callback for when a subtask's completion status changes. */
  onSubtaskChange: (taskId: string, subtaskId: string, changes: Partial<Subtask>) => void;
  /** Callback to add a new subtask to the current task. Returns the ID of the created subtask. */
  onAddSubtask: (taskId: string, subtaskTitle: string, storyPoints: number) => string;
  /** Callback to remove a subtask from the current task. */
  onRemoveSubtask: (taskId: string, subtaskId: string) => void;
  /** Callback to add a new work log to the current task. */
  onAddLog: (taskId: string, logContent: string) => void;
  /** Callback to update an existing work log. */
  onUpdateLog: (taskId: string, logId: string, newContent: string) => void;
  /** Callback to delete an existing work log. */
  onDeleteLog: (taskId: string, logId: string) => void;
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
  onDeleteTask,
  onSubtaskChange,
  onAddSubtask,
  onRemoveSubtask,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
const [deadline, setDeadline] = useState<Date | undefined>(
  task.deadline ? new Date(task.deadline) : undefined
);

const [link, setLink] = useState(task.link ?? "");
const [newLog, setNewLog] = useState("");
const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
const [newSubtaskPoints, setNewSubtaskPoints] = useState(2);

const [editingLogId, setEditingLogId] = useState<string | null>(null);
const [editingLogContent, setEditingLogContent] = useState("");
const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
const [pendingSubtaskFocusId, setPendingSubtaskFocusId] = useState<string | null>(null);
const subtaskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { toast } = useToast();
  
  const storyPoints = useMemo(() => {
    return task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
  }, [task.subtasks]);

  const lastTaskIdRef = useRef<string>(task.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setDeadline(task.deadline ? new Date(task.deadline) : undefined);
    setLink(task.link ?? "");
    setEditingLogId(null);
    setDeletingLogId(null);
    setDeleteAlertOpen(false);

    if (lastTaskIdRef.current !== task.id) {
      setPendingSubtaskFocusId(null);
      subtaskInputRefs.current = {};
      lastTaskIdRef.current = task.id;
    }
  }, [open, task]);

  useEffect(() => {
    if (!pendingSubtaskFocusId) {
      return;
    }

    const focusInput = () => {
      const input = subtaskInputRefs.current[pendingSubtaskFocusId];
      if (!input) return;
      input.focus();
      input.select();
      input.scrollIntoView({ block: "nearest" });
    };

    let fallbackTimeout: number | null = null;
    const rafId = window.requestAnimationFrame(() => {
      focusInput();
      fallbackTimeout = window.setTimeout(() => {
        focusInput();
        setPendingSubtaskFocusId(null);
      }, 60);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      if (fallbackTimeout !== null) {
        window.clearTimeout(fallbackTimeout);
      }
    };
  }, [pendingSubtaskFocusId, task.subtasks]);

  const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
  const totalSubtaskStoryPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
  const completedStoryPoints = task.subtasks.filter(st => st.isCompleted).reduce((sum, st) => sum + st.storyPoints, 0);

  const handleSaveChanges = () => {
    onUpdateTask(task.id, { 
      title, 
      description, 
      status,
      priority,
      deadline: deadline?.toISOString(),
      storyPoints: storyPoints,
      link: link.trim(),
    });
    toast({
      title: "Task Updated",
      description: "Your changes have been saved.",
    });
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    onDeleteTask(task.id);
    setDeleteAlertOpen(false);
    onOpenChange(false);
    toast({
      title: "Task Deleted",
      description: `Task "${task.title}" has been deleted.`,
    });
  };

  const handleAddLog = () => {
    if (newLog.trim()) {
      onAddLog(task.id, newLog.trim());
      setNewLog("");
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      let points = newSubtaskPoints;
      if (points < 1) points = 1;
      if (points > 5) points = 5;
      const createdSubtaskId = onAddSubtask(
        task.id,
        newSubtaskTitle.trim(),
        points,
      );
      if (createdSubtaskId) {
        setPendingSubtaskFocusId(createdSubtaskId);
      }
      setNewSubtaskTitle("");
      setNewSubtaskPoints(2);
    }
  };
  
  const handleSubtaskPointsChange = (subtaskId: string, points: number) => {
    let newPoints = points;
    if (newPoints < 1) newPoints = 1;
    if (newPoints > 5) newPoints = 5;
    onSubtaskChange(task.id, subtaskId, { storyPoints: newPoints });
  };
  
  const handleSubtaskTitleChange = (subtaskId: string, title: string) => {
    onSubtaskChange(task.id, subtaskId, { title });
  };

  const handleSubtaskInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    subtask: Subtask,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    const sourceInput = event.currentTarget;
    const newSubtaskId = onAddSubtask(
      task.id,
      "",
      Number.isFinite(subtask.storyPoints) ? subtask.storyPoints : newSubtaskPoints,
    );
    if (sourceInput) {
      sourceInput.blur();
    }
    if (newSubtaskId) {
      setPendingSubtaskFocusId(newSubtaskId);
    }
  };

  const handleStartEditLog = (log: Log) => {
    setEditingLogId(log.id);
    setEditingLogContent(log.content);
  };

  const handleCancelEditLog = () => {
    setEditingLogId(null);
    setEditingLogContent("");
  };

  const handleSaveLog = () => {
    if (editingLogId && editingLogContent.trim()) {
      onUpdateLog(task.id, editingLogId, editingLogContent.trim());
      handleCancelEditLog();
    }
  };

  const handleDeleteLog = () => {
    if (deletingLogId) {
      onDeleteLog(task.id, deletingLogId);
      setDeletingLogId(null);
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
               <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="obsidian://open?vault=..."
                  />
                  {link.trim() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8 shrink-0"
                    >
                      <a href={link} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open link</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>
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
                      <Input type="number" value={storyPoints} disabled />
                  </div>
                   <div className="flex flex-col space-y-2">
                      <Label>Due Date</Label>
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
                              {deadline ? format(deadline, "MM/dd/yy") : <span>Pick a date</span>}
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
                      Subtasks ({completedSubtasks}/{task.subtasks.length}) - {completedStoryPoints}/{totalSubtaskStoryPoints} pts
                  </h3>
                  <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center space-x-2 group">
                              <Checkbox
                                  id={`subtask-${subtask.id}`}
                                  checked={subtask.isCompleted}
                                  onCheckedChange={(checked) =>
                                    onSubtaskChange(task.id, subtask.id, { isCompleted: !!checked })
                                  }
                              />
                              <Input
                                ref={(element) => {
                                  if (element) {
                                    subtaskInputRefs.current[subtask.id] = element;
                                  } else {
                                    delete subtaskInputRefs.current[subtask.id];
                                  }
                                }}
                                value={subtask.title}
                                onChange={(e) => handleSubtaskTitleChange(subtask.id, e.target.value)}
                                onKeyDown={(event) => handleSubtaskInputKeyDown(event, subtask)}
                                className={`flex-1 h-8 ${subtask.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                              />
                               <Input
                                type="number"
                                min="1"
                                max="5"
                                value={subtask.storyPoints}
                                onChange={(e) => handleSubtaskPointsChange(subtask.id, Number(e.target.value))}
                                className="w-20 h-8"
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
                        min="1" max="5"
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
                    <div key={log.id} className="text-sm text-muted-foreground group">
                      {editingLogId === log.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingLogContent}
                            onChange={(e) => setEditingLogContent(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveLog}>Save</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEditLog}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">{log.content}</p>
                          <div className="flex items-center justify-between">
                              <p>{new Date(log.createdAt).toLocaleString()}</p>
                              <div className="flex opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleStartEditLog(log)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setDeletingLogId(log.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {task.logs.length === 0 && <p className="text-sm text-muted-foreground">No logs yet.</p>}
                </div>

                {editingLogId === null && (
                  <div className="space-y-2">
                     <Textarea 
                        placeholder="Add a new work log..."
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                     />
                     <Button onClick={handleAddLog} disabled={!newLog.trim()}>Add Log</Button>
                  </div>
                )}
              </div>
          </div>
          <DialogFooter className="flex justify-between w-full">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteAlertOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingLogId} onOpenChange={(open) => !open && setDeletingLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this work log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task &quot;{task.title}&quot; and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
