"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Play,
  NotebookPen,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { useTodoContext, CATEGORY_COLOR_PALETTE } from "@/context/todo-context";
import { PersonalTodos } from "@/components/dashboard/personal-todos";
import { TodoDetailsDialog } from "@/components/todo/todo-details-dialog";

type DraftMap = Record<string, string>;

export default function TodoBacklogPage() {
  const {
    categories,
    getCategoryTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategoryOrder,
    addBacklogTodo,
    updateTodoText,
    toggleTodoDone,
    moveTodoToActive,
    deleteTodo,
    isHydrated,
  } = useTodoContext();

  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryColorDraft, setCategoryColorDraft] = useState<string>(
    () => CATEGORY_COLOR_PALETTE[0],
  );
  const [todoDrafts, setTodoDrafts] = useState<DraftMap>({});
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);
  const [editingTodo, setEditingTodo] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [detailsTodoId, setDetailsTodoId] = useState<string | null>(null);

  const backlogCount = useMemo(
    () =>
      categories.reduce(
        (count, category) => count + getCategoryTodos(category.id).length,
        0,
      ),
    [categories, getCategoryTodos],
  );

  const getSuggestedColor = useCallback(() => {
    const used = new Set(categories.map((category) => category.color));
    for (const color of CATEGORY_COLOR_PALETTE) {
      if (!used.has(color)) {
        return color;
      }
    }
    return CATEGORY_COLOR_PALETTE[categories.length % CATEGORY_COLOR_PALETTE.length];
  }, [categories]);

  const handleAddCategory = () => {
    if (!isHydrated || !categoryDraft.trim()) return;
    const newId = addCategory(categoryDraft, categoryColorDraft);
    if (newId) {
      setCategoryDraft("");
      setCategoryColorDraft(getSuggestedColor());
    }
  };

  const handleCategoryUpdate = () => {
    if (!isHydrated || !editingCategory) return;
    updateCategory(editingCategory.id, {
      name: editingCategory.name,
      color: editingCategory.color,
    });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (!isHydrated) return;
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            "Delete this category? All backlog todos in it will be removed.",
          );
    if (!confirmed) return;
    deleteCategory(id);
    setTodoDrafts((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (editingCategory?.id === id) {
      setEditingCategory(null);
    }
    setCategoryColorDraft(getSuggestedColor());
  };

  const handleAddTodo = (categoryId: string) => {
    if (!isHydrated) return;
    const draft = todoDrafts[categoryId]?.trim();
    if (!draft) return;
    addBacklogTodo(categoryId, draft);
    setTodoDrafts((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const handleSaveTodo = () => {
    if (!isHydrated || !editingTodo) return;
    if (!editingTodo.text.trim()) {
      setEditingTodo(null);
      return;
    }
    updateTodoText(editingTodo.id, editingTodo.text);
    setEditingTodo(null);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todo Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Organize all quick tasks by category, then promote the ones you want
            to focus on. Backlog items: {backlogCount}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBacklogOpen((prev) => !prev)}
        >
          {isBacklogOpen ? "Hide backlog" : "Show backlog"}
        </Button>
      </header>

      <PersonalTodos />

      {isBacklogOpen && (
        <section className="flex flex-col gap-4">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
            <CardDescription>
              Create buckets like &quot;School&quot; or &quot;Work&quot; to group
              backlog todos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddCategory();
              }}
            >
              <Input
                placeholder="Category name..."
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                disabled={!isHydrated}
              />
              <input
                type="color"
                value={categoryColorDraft}
                onChange={(event) => setCategoryColorDraft(event.target.value)}
                aria-label="Category color"
                className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1"
                disabled={!isHydrated}
              />
              <Button type="submit" disabled={!isHydrated}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add your first category to start capturing todos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => {
              const todos = getCategoryTodos(category.id);
              const todoDraft = todoDrafts[category.id] ?? "";
              const isEditingCategory = editingCategory?.id === category.id;

              return (
                <Card key={category.id} className="flex flex-col">
                  <CardHeader className="space-y-2">
                    {isEditingCategory ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={editingCategory.name}
                          onChange={(event) =>
                            setEditingCategory((prev) =>
                              prev
                                ? { ...prev, name: event.target.value }
                                : {
                                    id: category.id,
                                    name: event.target.value,
                                    color: category.color,
                                  },
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCategoryUpdate();
                            }
                          }}
                          autoFocus
                        />
                        <input
                          type="color"
                          value={editingCategory.color}
                          onChange={(event) =>
                            setEditingCategory((prev) =>
                              prev
                                ? { ...prev, color: event.target.value }
                                : {
                                    id: category.id,
                                    name: category.name,
                                    color: event.target.value,
                                  },
                            )
                          }
                          aria-label="Category color"
                          className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1"
                        />
                        <Button
                          size="icon"
                          onClick={handleCategoryUpdate}
                          className="h-9 w-9"
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Save category</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingCategory(null)}
                          className="h-9 w-9"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel edit</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-border"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </CardTitle>
                          <CardDescription>
                            {todos.length} todo
                            {todos.length === 1 ? "" : "s"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => moveCategoryOrder(category.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                            <span className="sr-only">Move category up</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => moveCategoryOrder(category.id, "down")}
                            disabled={index === categories.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                            <span className="sr-only">Move category down</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              setEditingCategory({
                                id: category.id,
                                name: category.name,
                                color: category.color,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Rename category</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete category</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAddTodo(category.id);
                      }}
                    >
                      <Input
                        placeholder="Add a todo..."
                        value={todoDraft}
                        onChange={(event) =>
                          setTodoDrafts((prev) => ({
                            ...prev,
                            [category.id]: event.target.value,
                          }))
                        }
                        disabled={!isHydrated}
                      />
                      <Button type="submit" size="icon" disabled={!isHydrated}>
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add todo</span>
                      </Button>
                    </form>

                    <div className="space-y-2">
                      {todos.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nothing captured yet.
                        </p>
                      ) : (
                        todos.map((todo) => {
                          const isEditingTodo = editingTodo?.id === todo.id;
                          const linkHref = todo.link?.trim() ?? "";
                          const hasLink = linkHref.length > 0;
                          return (
                            <div
                              key={todo.id}
                              className="flex items-start gap-2 rounded-md border border-transparent p-2 transition-colors hover:border-border group"
                            >
                              <Checkbox
                                id={todo.id}
                                checked={todo.isDone}
                                onCheckedChange={() => toggleTodoDone(todo.id)}
                                className="mt-1"
                              />
                              {isEditingTodo ? (
                                <div className="flex-1">
                                  <div className="flex gap-1">
                                    <Input
                                      value={editingTodo.text}
                                      onChange={(event) =>
                                        setEditingTodo({
                                          id: todo.id,
                                          text: event.target.value,
                                        })
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          handleSaveTodo();
                                        }
                                      }}
                                      autoFocus
                                      className="h-8"
                                    />
                                    <Button
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={handleSaveTodo}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">
                                        Save todo
                                      </span>
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => setEditingTodo(null)}
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">
                                        Cancel edit
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={todo.id}
                                      className={`font-normal ${todo.isDone ? "line-through text-muted-foreground" : ""}`}
                                    >
                                      {todo.text}
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
                                        <span className="sr-only">
                                          Open link
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                              {!isEditingTodo && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setDetailsTodoId(todo.id)}
                                  >
                                    <NotebookPen className="h-4 w-4" />
                                    <span className="sr-only">
                                      View notes and logs
                                    </span>
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      moveTodoToActive(todo.id);
                                      if (editingTodo?.id === todo.id) {
                                        setEditingTodo(null);
                                      }
                                    }}
                                  >
                                    <Play className="h-4 w-4" />
                                    <span className="sr-only">
                                      Move to active
                                    </span>
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setEditingTodo({
                                        id: todo.id,
                                        text: todo.text,
                                      })
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit todo</span>
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      deleteTodo(todo.id);
                                      if (editingTodo?.id === todo.id) {
                                        setEditingTodo(null);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">
                                      Delete todo
                                    </span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      )}
      <TodoDetailsDialog
        todoId={detailsTodoId}
        open={detailsTodoId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTodoId(null);
          }
        }}
      />
    </div>
  );
}
