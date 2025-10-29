"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuickTask, TaskPriority, TaskStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, ExternalLink } from "lucide-react";

type QuickTaskDetailDialogProps = {
  task: QuickTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (id: string, changes: Partial<QuickTask>) => void;
  onDeleteTask: (id: string) => void;
  onAddLog: (id: string, content: string) => void;
  onUpdateLog: (id: string, logId: string, content: string) => void;
  onDeleteLog: (id: string, logId: string) => void;
};

const POINT_OPTIONS = [1, 2, 3, 4, 5] as const;
const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];

export function QuickTaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  onDeleteTask,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
}: QuickTaskDetailDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "Medium");
  const [points, setPoints] = useState<number>(task?.points ?? 1);
  const [link, setLink] = useState(task?.link ?? "");
  const [logDraft, setLogDraft] = useState("");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "To Do");

  useEffect(() => {
    if (!open || !task) {
      setLogDraft("");
    }
  }, [open, task]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setPoints(task.points);
    setLink(task.link ?? "");
    setStatus(task.status);
  }, [task]);

  const heading = useMemo(() => {
    const raw =
      title.trim() ||
      task?.title?.trim() ||
      task?.description?.trim() ||
      "Quick task";
    return raw.length > 64 ? `${raw.slice(0, 61)}…` : raw;
  }, [task, title]);

  const handleSave = () => {
    if (!task) return;
    onUpdateTask(task.id, {
      title: title.trim() || "Quick task",
      description: description.trim(),
      priority,
      points,
      link: link.trim(),
      status,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDeleteTask(task.id);
    onOpenChange(false);
  };

  const handleAddLog = () => {
    if (!task || !logDraft.trim()) return;
    onAddLog(task.id, logDraft.trim());
    setLogDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl space-y-6">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            Manage the quick task details, track progress, and capture work logs.
          </DialogDescription>
        </DialogHeader>

        {task ? (
          <>
            <section className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-task-title">Title</Label>
                <Input
                  id="quick-task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Name this quick task..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-task-description">Description</Label>
                <Textarea
                  id="quick-task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Summarize the work to complete..."
                  className="min-h-[96px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-task-priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as TaskPriority)}
                  >
                    <SelectTrigger id="quick-task-priority">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-task-points">Points (1–5)</Label>
                  <Select
                    value={String(points)}
                    onValueChange={(value) => setPoints(Number(value))}
                  >
                    <SelectTrigger id="quick-task-points">
                      <SelectValue placeholder="Points" />
                    </SelectTrigger>
                    <SelectContent>
                      {POINT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-task-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as TaskStatus)}
                  >
                    <SelectTrigger id="quick-task-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-task-link">Reference Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quick-task-link"
                      value={link}
                      onChange={(event) => setLink(event.target.value)}
                      placeholder="https://..."
                    />
                    {task.link?.trim() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 shrink-0"
                      >
                        <a href={task.link} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open link</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium leading-none">Work Log</h3>
                <p className="text-xs text-muted-foreground">
                  Track quick notes about the effort you put into this task.
                </p>
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <Textarea
                  value={logDraft}
                  onChange={(event) => setLogDraft(event.target.value)}
                  placeholder="Document the work you just completed..."
                  className="min-h-[88px]"
                />
                <Button
                  onClick={handleAddLog}
                  disabled={!logDraft.trim()}
                  className="md:self-start"
                >
                  Add Log
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded border border-border">
                <div className="space-y-3 p-3 pr-4">
                  {task.logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No work logs yet. Add your first update above.
                    </p>
                  ) : (
                    task.logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-md border border-border/70 bg-background p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => onDeleteLog(task.id, log.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete log</span>
                          </Button>
                        </div>
                        <Textarea
                          value={log.content}
                          onChange={(event) =>
                            onUpdateLog(task.id, log.id, event.target.value)
                          }
                          className="mt-2 min-h-[72px]"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="sm:order-1"
              >
                Delete Task
              </Button>
              <div className="flex flex-1 justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            The selected quick task could not be found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
