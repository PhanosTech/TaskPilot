
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil, Check, X, ArrowDown, ArrowUp } from "lucide-react";

/**
 * @type Todo
 * Represents a single personal todo item.
 */
type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const IN_PROGRESS_STORAGE_KEY = "taskpilot-personal-todos-in-progress";
const BACKLOG_STORAGE_KEY = "taskpilot-personal-todos-backlog";

/**
 * @component PersonalTodos
 * A component for managing a personal to-do list, separate from project tasks.
 * It supports adding, editing, deleting, completing, and moving todos between "In Progress" and "Backlog" lists.
 * The state is persisted in local storage.
 */
export function PersonalTodos() {
  const [inProgressTodos, setInProgressTodos] = useState<Todo[]>([]);
  const [backlogTodos, setBacklogTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingTodo, setEditingTodo] = useState<{ id: string; text: string } | null>(null);

  // Load todos from local storage on initial render
  useEffect(() => {
    const savedInProgress = localStorage.getItem(IN_PROGRESS_STORAGE_KEY);
    if (savedInProgress) {
      setInProgressTodos(JSON.parse(savedInProgress));
    }
    const savedBacklog = localStorage.getItem(BACKLOG_STORAGE_KEY);
    if (savedBacklog) {
      setBacklogTodos(JSON.parse(savedBacklog));
    }
  }, []);

  // Save todos to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(IN_PROGRESS_STORAGE_KEY, JSON.stringify(inProgressTodos));
  }, [inProgressTodos]);

  useEffect(() => {
    localStorage.setItem(BACKLOG_STORAGE_KEY, JSON.stringify(backlogTodos));
  }, [backlogTodos]);
  
  /**
   * @function handleAddTodo
   * Adds a new todo item to the "In Progress" list.
   */
  const handleAddTodo = () => {
    if (newTodo.trim() === "") return;
    const newTodoItem: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
    };
    setInProgressTodos([newTodoItem, ...inProgressTodos]);
    setNewTodo("");
  };
  
  /**
   * @function handleToggleTodo
   * Toggles the completion status of a todo item in either list.
   * @param {string} id - The ID of the todo to toggle.
   * @param {'in-progress' | 'backlog'} list - The list the todo belongs to.
   */
  const handleToggleTodo = (id: string, list: 'in-progress' | 'backlog') => {
    const listSetter = list === 'in-progress' ? setInProgressTodos : setBacklogTodos;
    listSetter(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  /**
   * @function handleMoveTodo
   * Moves a todo item from one list to the other.
   * @param {string} id - The ID of the todo to move.
   * @param {'in-progress' | 'backlog'} from - The list the todo is currently in.
   */
  const handleMoveTodo = (id: string, from: 'in-progress' | 'backlog') => {
    if (from === 'in-progress') {
      const todoToMove = inProgressTodos.find(t => t.id === id);
      if (todoToMove) {
        setInProgressTodos(prev => prev.filter(t => t.id !== id));
        setBacklogTodos(prev => [todoToMove, ...prev]);
      }
    } else {
      const todoToMove = backlogTodos.find(t => t.id === id);
      if (todoToMove) {
        setBacklogTodos(prev => prev.filter(t => t.id !== id));
        setInProgressTodos(prev => [todoToMove, ...prev]);
      }
    }
  };

  /**
   * @function handleDeleteTodo
   * Deletes a todo item from a specified list.
   * @param {string} id - The ID of the todo to delete.
   * @param {'in-progress' | 'backlog'} list - The list the todo belongs to.
   */
  const handleDeleteTodo = (id: string, list: 'in-progress' | 'backlog') => {
    const listSetter = list === 'in-progress' ? setInProgressTodos : setBacklogTodos;
    listSetter(prev => prev.filter(todo => todo.id !== id));
  };

  /**
   * @function handleUpdateTodo
   * Saves the changes after editing a todo item's text.
   */
  const handleUpdateTodo = () => {
    if (!editingTodo) return;

    setInProgressTodos(prev => prev.map(todo => 
      todo.id === editingTodo.id ? { ...todo, text: editingTodo.text } : todo
    ));
    setBacklogTodos(prev => prev.map(todo => 
      todo.id === editingTodo.id ? { ...todo, text: editingTodo.text } : todo
    ));

    setEditingTodo(null);
  };
  
  /**
   * @function handleClearCompleted
   * Removes all completed todos from both lists.
   */
  const handleClearCompleted = () => {
    setInProgressTodos(prev => prev.filter(t => !t.completed));
    setBacklogTodos(prev => prev.filter(t => !t.completed));
  };

  /**
   * @function renderTodoList
   * Renders a list of todo items with their controls.
   * @param {Todo[]} todos - The array of todos to render.
   * @param {'in-progress' | 'backlog'} listType - The type of list being rendered.
   * @param {string} title - The title to display for the list section.
   * @returns {JSX.Element} The rendered todo list.
   */
  const renderTodoList = (
    todos: Todo[], 
    listType: 'in-progress' | 'backlog', 
    title: string
  ) => (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-2">
        {todos.length > 0 ? (
          todos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2 group">
              <Checkbox
                id={todo.id}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id, listType)}
              />
              {editingTodo?.id === todo.id ? (
                <div className="flex-1 flex gap-1">
                  <Input 
                    value={editingTodo.text}
                    onChange={(e) => setEditingTodo({...editingTodo, text: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTodo()}
                    className="h-8"
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleUpdateTodo}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTodo(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <>
                  <Label
                    htmlFor={todo.id}
                    className={`font-normal flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {todo.text}
                  </Label>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleMoveTodo(todo.id, listType)}
                      aria-label={
                        listType === 'in-progress'
                          ? 'Move to Backlog'
                          : 'Move to In Progress'
                      }
                    >
                      {listType === 'in-progress' ? (
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {listType === 'in-progress'
                          ? 'Move to Backlog'
                          : 'Move to In Progress'}
                      </span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTodo({id: todo.id, text: todo.text})}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteTodo(todo.id, listType)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No tasks in this list.</p>
        )}
      </div>
    </div>
  );

  const hasCompleted = inProgressTodos.some(t => t.completed) || backlogTodos.some(t => t.completed);

  return (
    <Card className="col-span-1 lg:col-span-3 flex flex-col">
      <CardHeader>
        <CardTitle>Personal Todos</CardTitle>
        <CardDescription>
          A simple checklist for tasks not tied to projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTodo();
              }
            }}
          />
          <Button onClick={handleAddTodo} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {renderTodoList(inProgressTodos, 'in-progress', 'In Progress')}
          
          <Separator className="my-4" />
          
          {renderTodoList(backlogTodos, 'backlog', 'Backlog')}
        </div>
      </CardContent>
      {hasCompleted && (
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleClearCompleted}>
            Clear Completed Todos
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
