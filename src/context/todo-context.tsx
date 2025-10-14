"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialTodoState,
  type TodoCategory,
  type TodoItem,
  type TodoState,
  type TodoStatus,
} from "@/lib/todo-storage";

export const CATEGORY_COLOR_PALETTE = [
  "#2563EB",
  "#DB2777",
  "#059669",
  "#F97316",
  "#7C3AED",
  "#0EA5E9",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#6366F1",
];

const SAVE_DEBOUNCE_MS = 500;

const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

type TodoContextValue = {
  categories: TodoCategory[];
  backlogTodos: TodoItem[];
  activeTodos: TodoItem[];
  getCategoryTodos: (categoryId: string) => TodoItem[];
  getCategoryById: (categoryId: string) => TodoCategory | undefined;
  getTodoById: (id: string) => TodoItem | undefined;
  addCategory: (name: string, color?: string) => string;
  updateCategory: (id: string, data: Partial<Pick<TodoCategory, "name" | "color">>) => void;
  deleteCategory: (id: string) => void;
  moveCategoryOrder: (id: string, direction: "up" | "down") => void;
  addBacklogTodo: (categoryId: string, text: string) => void;
  addActiveTodo: (text: string, categoryId?: string) => void;
  updateTodoText: (id: string, text: string) => void;
  updateTodoNotes: (id: string, notes: string) => void;
  updateTodoLink: (id: string, link: string) => void;
  toggleTodoDone: (id: string) => void;
  moveTodoToActive: (id: string) => void;
  moveTodoToBacklog: (id: string, categoryId?: string) => void;
  deleteTodo: (id: string) => void;
  reorderActiveTodos: (sourceIndex: number, destinationIndex: number) => void;
  clearCompletedTodos: () => void;
  addTodoLog: (id: string, content: string) => void;
  deleteTodoLog: (id: string, logId: string) => void;
  scratchpadContent: string;
  updateScratchpad: (content: string) => void;
  isHydrated: boolean;
};

const TodoContext = createContext<TodoContextValue | undefined>(undefined);

function normalizeTodoLogs(logs: TodoItem["logs"] | unknown): TodoItem["logs"] {
  if (!Array.isArray(logs)) {
    return [];
  }
  return logs
    .map((log) => {
      if (!log || typeof log !== "object") {
        return null;
      }
      const id =
        typeof (log as { id?: unknown }).id === "string"
          ? (log as { id: string }).id
          : `todo-log-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const content =
        typeof (log as { content?: unknown }).content === "string"
          ? (log as { content: string }).content
          : "";
      const createdAt =
        typeof (log as { createdAt?: unknown }).createdAt === "number"
          ? (log as { createdAt: number }).createdAt
          : Date.now();
      if (!content) {
        return null;
      }
      return { id, content, createdAt };
    })
    .filter((log): log is TodoItem["logs"][number] => !!log);
}

function ensureCategoryColors(state: TodoState): TodoState {
  const usedColors = new Set(
    state.categories
      .map((category) => category.color)
      .filter((color): color is string => typeof color === "string"),
  );

  let paletteIndex = 0;
  const categoriesWithColor = state.categories.map((category) => {
    if (category.color) {
      return category;
    }
    let color = CATEGORY_COLOR_PALETTE[paletteIndex % CATEGORY_COLOR_PALETTE.length];
    let attempts = 0;
    while (usedColors.has(color) && attempts < CATEGORY_COLOR_PALETTE.length) {
      paletteIndex += 1;
      color = CATEGORY_COLOR_PALETTE[paletteIndex % CATEGORY_COLOR_PALETTE.length];
      attempts += 1;
    }
    usedColors.add(color);
    paletteIndex += 1;
    return {
      ...category,
      color,
    };
  });

  return {
    ...state,
    categories: categoriesWithColor,
    todos: state.todos.map((todo) => ({
      ...todo,
      notes: typeof todo.notes === "string" ? todo.notes : "",
      logs: normalizeTodoLogs(todo.logs),
      link: typeof todo.link === "string" ? todo.link : "",
    })),
  };
}

function pickCategoryColor(existing: TodoCategory[]): string {
  const used = new Set(existing.map((category) => category.color));
  for (const color of CATEGORY_COLOR_PALETTE) {
    if (!used.has(color)) {
      return color;
    }
  }
  const randomColor = CATEGORY_COLOR_PALETTE[(existing.length) % CATEGORY_COLOR_PALETTE.length];
  return randomColor;
}

function sanitizeHexColor(color?: string): string | undefined {
  if (!color) return undefined;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TodoState>(initialTodoState);
  const [scratchpadContent, setScratchpadContent] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  const saveToServer = useCallback(async (nextState: TodoState, nextScratchpad: string) => {
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalTodos: nextState,
          scratchpad: nextScratchpad,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to persist personal workspace: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to save personal workspace state to server", error);
    }
  }, []);
  const saveRef = useRef(
    debounce((nextState: TodoState, nextScratchpad: string) => {
      void saveToServer(nextState, nextScratchpad);
    }, SAVE_DEBOUNCE_MS),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/data");
        if (!response.ok) {
          throw new Error(`Failed to load personal workspace: ${response.status}`);
        }
        const payload = await response.json();
        if (cancelled) {
          return;
        }
        const serverState = payload?.personalTodos ?? initialTodoState;
        setState(ensureCategoryColors(serverState));
        setScratchpadContent(
          typeof payload?.scratchpad === "string" ? payload.scratchpad : "",
        );
      } catch (error) {
        console.error("Failed to load personal workspace state from server", error);
        if (!cancelled) {
          setState(initialTodoState);
          setScratchpadContent("");
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveRef.current(state, scratchpadContent);
    }
  }, [state, scratchpadContent, isHydrated]);

  const updateScratchpad = useCallback((content: string) => {
    setScratchpadContent(content);
  }, []);

  const addCategory = useCallback((name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "";
    }
    let newId = "";
    setState((prev) => {
      const exists = prev.categories.find(
        (category) =>
          category.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (exists) {
        newId = exists.id;
        return prev;
      }
      const existingCategories = prev.categories;
      const generatedId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `category-${Date.now()}`;
      const resolvedColor =
        sanitizeHexColor(color) ?? pickCategoryColor(existingCategories);
      const category: TodoCategory = {
        id: generatedId,
        name: trimmed,
        color: resolvedColor,
      };
      newId = category.id;
      return {
        ...prev,
        categories: [...existingCategories, category],
      };
    });
    return newId;
  }, []);

  const updateCategory = useCallback(
    (id: string, data: Partial<Pick<TodoCategory, "name" | "color">>) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((category) => {
          if (category.id !== id) return category;
          const updates: Partial<TodoCategory> = {};
          if (typeof data.name === "string") {
            const trimmed = data.name.trim();
            if (trimmed) {
              updates.name = trimmed;
            }
          }
          if (typeof data.color === "string") {
            const resolved = sanitizeHexColor(data.color);
            if (resolved) {
              updates.color = resolved;
            }
          }
          return { ...category, ...updates };
        }),
      }));
    },
    [],
  );

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => {
      const remainingCategories = prev.categories.filter(
        (category) => category.id !== id,
      );
      const remainingTodos = prev.todos.filter(
        (todo) => todo.categoryId !== id,
      );
      const remainingActiveOrder = prev.activeOrder.filter((todoId) =>
        remainingTodos.some((todo) => todo.id === todoId),
      );
      return {
        categories: remainingCategories,
        todos: remainingTodos,
        activeOrder: remainingActiveOrder,
      };
    });
  }, []);

  const moveCategoryOrder = useCallback((id: string, direction: "up" | "down") => {
    setState((prev) => {
      const index = prev.categories.findIndex((category) => category.id === id);
      if (index === -1) {
        return prev;
      }
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.categories.length) {
        return prev;
      }
      const categories = [...prev.categories];
      const [moved] = categories.splice(index, 1);
      categories.splice(targetIndex, 0, moved);
      return {
        ...prev,
        categories,
      };
    });
  }, []);

  const addBacklogTodo = useCallback((categoryId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => {
      const categoryExists = prev.categories.some(
        (category) => category.id === categoryId,
      );
      if (!categoryExists) {
        return prev;
      }
      const timestamp = Date.now();
      const todoId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `todo-${timestamp}`;
      const todo: TodoItem = {
        id: todoId,
        text: trimmed,
        categoryId,
        status: "backlog",
        isDone: false,
        createdAt: timestamp,
        notes: "",
        logs: [],
        link: "",
      };
      return {
        ...prev,
        todos: [todo, ...prev.todos],
      };
    });
  }, []);

  const addActiveTodo = useCallback(
    (text: string, categoryId?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((prev) => {
        let categories = prev.categories;
        let targetCategoryId = categoryId;
        if (targetCategoryId) {
          const categoryExists = categories.some(
            (category) => category.id === targetCategoryId,
          );
          if (!categoryExists) {
            return prev;
          }
        } else {
          const quickCaptureName = "Quick Capture";
          const existing = categories.find(
            (cat) =>
              cat.name.trim().toLowerCase() === quickCaptureName.toLowerCase(),
          );
          if (existing) {
            targetCategoryId = existing.id;
          } else {
            const newCategoryId =
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `category-${Date.now()}`;
            const newCategory: TodoCategory = {
              id: newCategoryId,
              name: quickCaptureName,
              color: pickCategoryColor(categories),
            };
            categories = [...categories, newCategory];
            targetCategoryId = newCategoryId;
          }
        }

        const timestamp = Date.now();
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `todo-${timestamp}`;
        const todo: TodoItem = {
          id,
          text: trimmed,
          categoryId: targetCategoryId!,
          status: "active",
          isDone: false,
          createdAt: timestamp,
          notes: "",
          logs: [],
          link: "",
        };
        return {
          categories,
          todos: [todo, ...prev.todos],
          activeOrder: [id, ...prev.activeOrder.filter((existingId) => existingId !== id)],
        };
      });
    },
    [],
  );

  const updateTodoText = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, text: trimmed } : todo,
      ),
    }));
  }, []);

  const updateTodoNotes = useCallback((id: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, notes } : todo,
      ),
    }));
  }, []);

  const updateTodoLink = useCallback((id: string, link: string) => {
    const trimmed = link.trim();
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, link: trimmed } : todo,
      ),
    }));
  }, []);

  const toggleTodoDone = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, isDone: !todo.isDone } : todo,
      ),
    }));
  }, []);

  const moveTodoToActive = useCallback((id: string) => {
    setState((prev) => {
      const todo = prev.todos.find((item) => item.id === id);
      if (!todo) {
        return prev;
      }
      if (todo.status === "active") {
        const isExisting = prev.activeOrder.includes(id);
        return isExisting
          ? prev
          : { ...prev, activeOrder: [id, ...prev.activeOrder] };
      }
      const updatedTodo = { ...todo, status: "active" as TodoStatus };
      return {
        ...prev,
        todos: prev.todos.map((t) => (t.id === id ? updatedTodo : t)),
        activeOrder: [id, ...prev.activeOrder.filter((todoId) => todoId !== id)],
      };
    });
  }, []);

  const moveTodoToBacklog = useCallback((id: string, categoryId?: string) => {
    setState((prev) => {
      const todo = prev.todos.find((item) => item.id === id);
      if (!todo) {
        return prev;
      }
      const targetCategoryId = categoryId ?? todo.categoryId;
      const categoryExists = prev.categories.some(
        (category) => category.id === targetCategoryId,
      );
      if (!categoryExists) {
        return prev;
      }
      const updatedTodo: TodoItem = {
        ...todo,
        status: "backlog",
        categoryId: targetCategoryId,
      };
      return {
        ...prev,
        todos: prev.todos.map((t) => (t.id === id ? updatedTodo : t)),
        activeOrder: prev.activeOrder.filter((todoId) => todoId !== id),
      };
    });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.filter((todo) => todo.id !== id),
      activeOrder: prev.activeOrder.filter((todoId) => todoId !== id),
    }));
  }, []);

  const addTodoLog = useCallback((id: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }
    setState((prev) => {
      const timestamp = Date.now();
      const logId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `todo-log-${timestamp}`;
      return {
        ...prev,
        todos: prev.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                logs: [
                  {
                    id: logId,
                    content: trimmed,
                    createdAt: timestamp,
                  },
                  ...todo.logs,
                ],
              }
            : todo,
        ),
      };
    });
  }, []);

  const deleteTodoLog = useCallback((id: string, logId: string) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              logs: todo.logs.filter((log) => log.id !== logId),
            }
          : todo,
      ),
    }));
  }, []);

  const clearCompletedTodos = useCallback(() => {
    setState((prev) => {
      const remainingTodos = prev.todos.filter((todo) => !todo.isDone);
      const remainingActiveOrder = prev.activeOrder.filter((todoId) =>
        remainingTodos.some(
          (todo) => todo.id === todoId && todo.status === "active",
        ),
      );
      return {
        ...prev,
        todos: remainingTodos,
        activeOrder: remainingActiveOrder,
      };
    });
  }, []);

  const reorderActiveTodos = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      setState((prev) => {
        if (
          sourceIndex === destinationIndex ||
          sourceIndex < 0 ||
          destinationIndex < 0 ||
          sourceIndex >= prev.activeOrder.length ||
          destinationIndex >= prev.activeOrder.length
        ) {
          return prev;
        }
        const updatedOrder = [...prev.activeOrder];
        const [moved] = updatedOrder.splice(sourceIndex, 1);
        updatedOrder.splice(destinationIndex, 0, moved);
        return {
          ...prev,
          activeOrder: updatedOrder,
        };
      });
    },
    [],
  );

  const backlogTodos = useMemo(
    () => state.todos.filter((todo) => todo.status === "backlog"),
    [state.todos],
  );

  const activeTodos = useMemo(() => {
    const activeTodoMap = new Map(state.todos.map((todo) => [todo.id, todo]));
    return state.activeOrder
      .map((id) => activeTodoMap.get(id))
      .filter((todo): todo is TodoItem => !!todo && todo.status === "active");
  }, [state.activeOrder, state.todos]);

  const getCategoryTodos = useCallback(
    (categoryId: string) =>
      backlogTodos
        .filter((todo) => todo.categoryId === categoryId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [backlogTodos],
  );

  const getCategoryById = useCallback(
    (categoryId: string) =>
      state.categories.find((category) => category.id === categoryId),
    [state.categories],
  );

  const getTodoById = useCallback(
    (id: string) => state.todos.find((todo) => todo.id === id),
    [state.todos],
  );

  const value = useMemo<TodoContextValue>(
    () => ({
      categories: state.categories,
      backlogTodos,
      activeTodos,
      getCategoryTodos,
      getCategoryById,
      getTodoById,
      addCategory,
      updateCategory,
      deleteCategory,
      moveCategoryOrder,
      addBacklogTodo,
      addActiveTodo,
      updateTodoText,
      updateTodoNotes,
      updateTodoLink,
      toggleTodoDone,
      moveTodoToActive,
      moveTodoToBacklog,
      deleteTodo,
      reorderActiveTodos,
      clearCompletedTodos,
      addTodoLog,
      deleteTodoLog,
      scratchpadContent,
      updateScratchpad,
      isHydrated,
    }),
    [
      state.categories,
      backlogTodos,
      activeTodos,
      getCategoryTodos,
      getCategoryById,
      getTodoById,
      addCategory,
      updateCategory,
      deleteCategory,
      moveCategoryOrder,
      addBacklogTodo,
      addActiveTodo,
      updateTodoText,
      updateTodoNotes,
      updateTodoLink,
      toggleTodoDone,
      moveTodoToActive,
      moveTodoToBacklog,
      deleteTodo,
      reorderActiveTodos,
      clearCompletedTodos,
      addTodoLog,
      deleteTodoLog,
      scratchpadContent,
      updateScratchpad,
      isHydrated,
    ],
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodoContext() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodoContext must be used within a TodoProvider");
  }
  return context;
}
