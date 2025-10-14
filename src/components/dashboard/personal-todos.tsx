"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Undo2,
  ExternalLink,
  NotebookPen,
} from "lucide-react";
import { useTodoContext } from "@/context/todo-context";
import { TodoDetailsDialog } from "@/components/todo/todo-details-dialog";

export function PersonalTodos() {
  const {
    categories,
    activeTodos,
    backlogTodos,
    addActiveTodo,
    updateTodoText,
    toggleTodoDone,
    moveTodoToBacklog,
    deleteTodo,
    reorderActiveTodos,
    clearCompletedTodos,
    isHydrated,
  } = useTodoContext();
  const [newTodo, setNewTodo] = useState("");
  const [editingTodo, setEditingTodo] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [detailsTodoId, setDetailsTodoId] = useState<string | null>(null);

  const categoryLookup = useMemo(
    () =>
      new Map(
        categories.map(
          (category) =>
            [
              category.id,
              { name: category.name, color: category.color },
            ] as const,
        ),
      ),
    [categories],
  );

  const handleAddTodo = () => {
    if (!isHydrated || !newTodo.trim()) return;
    addActiveTodo(newTodo);
    setNewTodo("");
  };

  const handleUpdateTodo = () => {
    if (!editingTodo) return;
    if (!editingTodo.text.trim()) {
      setEditingTodo(null);
      return;
    }
    updateTodoText(editingTodo.id, editingTodo.text);
    setEditingTodo(null);
  };

  const handleReorder = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      reorderActiveTodos(index, index - 1);
    }
    if (direction === "down" && index < activeTodos.length - 1) {
      reorderActiveTodos(index, index + 1);
    }
  };

  const hasCompleted = useMemo(
    () =>
      [...activeTodos, ...backlogTodos].some((todo) => todo.isDone === true),
    [activeTodos, backlogTodos],
  );

  return (
    <>
      <Card className="col-span-1 lg:col-span-3 flex flex-col">
        <CardHeader>
          <CardTitle>Personal Todos</CardTitle>
          <CardDescription>
            Focus list for lightweight tasks. Manage backlog on the todo page.
          </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            disabled={!isHydrated}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTodo();
              }
            }}
          />
          <Button onClick={handleAddTodo} size="icon" disabled={!isHydrated}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add todo</span>
          </Button>
        </div>

        <div className="space-y-2">
          {activeTodos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active todos. Promote backlog items from the todo backlog page.
            </p>
          ) : (
            activeTodos.map((todo, index) => {
              const isEditing = editingTodo?.id === todo.id;
              const category = categoryLookup.get(todo.categoryId);
              const categoryName = category?.name ?? "Uncategorized";
              const categoryColor = category?.color ?? "#6B7280";
              const linkHref = todo.link?.trim() ?? "";
              const hasLink = linkHref.length > 0;
              return (
                <div
                  key={todo.id}
                  className="flex items-start gap-2 rounded-md border border-transparent p-1.5 transition-colors hover:border-border group"
                >
                  <Checkbox
                    id={todo.id}
                    checked={todo.isDone}
                    onCheckedChange={() => toggleTodoDone(todo.id)}
                    className="mt-1"
                  />
                  {isEditing ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-1">
                        <Input
                          value={editingTodo.text}
                          onChange={(event) =>
                            setEditingTodo({
                              id: editingTodo.id,
                              text: event.target.value,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleUpdateTodo();
                            }
                          }}
                          autoFocus
                          className="h-8"
                        />
                        <Button
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleUpdateTodo}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Save todo</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingTodo(null)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel edit</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span>Category: {categoryName}</span>
                        {hasLink && (
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="ml-1 inline-flex items-center text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="sr-only">Open link</span>
                          </a>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <Label
                          htmlFor={todo.id}
                          className={`font-normal flex items-center gap-2 ${todo.isDone ? "line-through text-muted-foreground" : ""}`}
                        >
                          <span className="break-words">{todo.text}</span>
                          <span
                            className="inline text-xs font-medium text-muted-foreground"
                            style={{ color: categoryColor }}
                          >
                            [{categoryName}]
                          </span>
                        </Label>
                        {hasLink && (
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="sr-only">Open link</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setDetailsTodoId(todo.id)}
                      >
                        <NotebookPen className="h-4 w-4" />
                        <span className="sr-only">View notes and logs</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleReorder(index, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={index === activeTodos.length - 1}
                        onClick={() => handleReorder(index, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveTodoToBacklog(todo.id)}
                      >
                        <Undo2 className="h-4 w-4" />
                        <span className="sr-only">Return to backlog</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() =>
                          setEditingTodo({ id: todo.id, text: todo.text })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit todo</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete todo</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
      {(hasCompleted || activeTodos.length > 0) && (
        <CardFooter className="flex flex-wrap gap-2 justify-between">
          {hasCompleted ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearCompletedTodos}
            >
              Clear Completed Todos
            </Button>
          ) : (
            <span />
          )}
          <Button variant="link" asChild>
            <Link href="/todo">Open todo backlog</Link>
          </Button>
        </CardFooter>
        )}
      </Card>
      <TodoDetailsDialog
        todoId={detailsTodoId}
        open={detailsTodoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTodoId(null);
          }
        }}
      />
    </>
  );
}
