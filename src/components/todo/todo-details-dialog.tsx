"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTodoContext } from "@/context/todo-context";
import { Trash2 } from "lucide-react";

type TodoDetailsDialogProps = {
  todoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TodoDetailsDialog({
  todoId,
  open,
  onOpenChange,
}: TodoDetailsDialogProps) {
  const {
    getTodoById,
    getCategoryById,
    updateTodoNotes,
    addTodoLog,
    deleteTodoLog,
    isHydrated,
  } = useTodoContext();
  const [logDraft, setLogDraft] = useState("");

  const todo = useMemo(() => (todoId ? getTodoById(todoId) : undefined), [todoId, getTodoById]);
  const category = useMemo(
    () => (todo ? getCategoryById(todo.categoryId) : undefined),
    [todo, getCategoryById],
  );

  useEffect(() => {
    if (!open) {
      setLogDraft("");
    }
  }, [open]);

  const handleAddLog = () => {
    if (!todo || !logDraft.trim()) return;
    addTodoLog(todo.id, logDraft);
    setLogDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{todo ? todo.text : "Todo details"}</DialogTitle>
          <DialogDescription>
            {category
              ? `Category: ${category.name}`
              : "Review notes and work logs for this todo."}
          </DialogDescription>
        </DialogHeader>

        {todo ? (
          <div className="space-y-6">
            <section className="space-y-2">
              <div>
                <h3 className="text-sm font-medium leading-none">Notes</h3>
                <p className="text-xs text-muted-foreground">
                  Capture quick instructions or context for this todo.
                </p>
              </div>
              <Textarea
                value={todo.notes}
                onChange={(event) => updateTodoNotes(todo.id, event.target.value)}
                placeholder="Add reference notes here..."
                className="min-h-[120px]"
                disabled={!isHydrated}
              />
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium leading-none">Work Log</h3>
                <p className="text-xs text-muted-foreground">
                  Keep a brief record of the work you complete for this todo.
                </p>
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={logDraft}
                  onChange={(event) => setLogDraft(event.target.value)}
                  placeholder="Document the work you just completed..."
                  className="min-h-[88px]"
                  disabled={!isHydrated}
                />
                <Button
                  onClick={handleAddLog}
                  disabled={!isHydrated || !logDraft.trim()}
                  className="self-start"
                >
                  Add Log
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded border border-border">
                <div className="space-y-3 p-3 pr-4">
                  {todo.logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No work logs yet. Add your first update above.
                    </p>
                  ) : (
                    todo.logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-md border border-border/70 bg-muted/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => deleteTodoLog(todo.id, log.id)}
                            disabled={!isHydrated}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete log</span>
                          </Button>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{log.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The selected todo could not be found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
