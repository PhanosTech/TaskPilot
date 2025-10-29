"use client";

import { useMemo, useState } from "react";
import type { Log, TaskPriority, TaskStatus } from "@/lib/types";
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
import { Trash2 } from "lucide-react";

type QuickTaskCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    points: number;
    link?: string;
    logs: Log[];
    status: TaskStatus;
  }) => void;
};

const POINT_OPTIONS = [1, 2, 3, 4, 5] as const;
const PRIORITY_OPTIONS: TaskPriority[] = ["High", "Medium", "Low"];
const STATUS_OPTIONS: TaskStatus[] = ["To Do", "In Progress", "Done"];

const generateLogId = () =>
  `qlog-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function QuickTaskCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: QuickTaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [points, setPoints] = useState<number>(2);
  const [link, setLink] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [logDraft, setLogDraft] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");

  const isCreateDisabled = useMemo(() => title.trim().length === 0, [title]);

  const heading = useMemo(() => {
    const raw = title.trim() || "New quick task";
    return raw.length > 64 ? `${raw.slice(0, 61)}…` : raw;
  }, [title]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setPoints(2);
    setLink("");
    setLogs([]);
    setLogDraft("");
    setStatus("To Do");
  };

  const handleCreate = () => {
    if (isCreateDisabled) {
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      priority,
      points,
      link: link.trim() || undefined,
      logs,
      status,
    });
    resetForm();
    onOpenChange(false);
  };

  const handleAddLog = () => {
    const content = logDraft.trim();
    if (!content) {
      return;
    }
    const newLog: Log = {
      id: generateLogId(),
      content,
      createdAt: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, newLog]);
    setLogDraft("");
  };

  const handleUpdateLog = (logId: string, content: string) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, content } : log,
      ),
    );
  };

  const handleDeleteLog = (logId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== logId));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-xl space-y-6">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            Capture the essentials for a quick task, then log any immediate notes before you get started.
          </DialogDescription>
        </DialogHeader>

        <section className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-task-create-title">Title</Label>
            <Input
              id="quick-task-create-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a short task title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-task-create-description">Description</Label>
            <Textarea
              id="quick-task-create-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add optional execution notes or acceptance details..."
              className="min-h-[96px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-task-create-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="quick-task-create-priority">
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
              <Label htmlFor="quick-task-create-points">Points (1–5)</Label>
              <Select
                value={String(points)}
                onValueChange={(value) => setPoints(Number(value))}
              >
                <SelectTrigger id="quick-task-create-points">
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

          <div className="space-y-2">
            <Label htmlFor="quick-task-create-link">Reference Link</Label>
            <Input
              id="quick-task-create-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-task-create-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="quick-task-create-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium leading-none">Work Log</h3>
            <p className="text-xs text-muted-foreground">
              Add any immediate notes about what you plan to do or just completed.
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
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No work logs yet. Add your first update above.
                </p>
              ) : (
                logs.map((log) => (
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
                        onClick={() => handleDeleteLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete log</span>
                      </Button>
                    </div>
                    <Textarea
                      value={log.content}
                      onChange={(event) =>
                        handleUpdateLog(log.id, event.target.value)
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
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreateDisabled}>
            Create Quick Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
