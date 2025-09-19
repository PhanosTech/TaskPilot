
"use client";

import { useState } from "react";
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

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

export function PersonalTodos() {
  const [inProgressTodos, setInProgressTodos] = useState<Todo[]>([]);
  const [backlogTodos, setBacklogTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingTodo, setEditingTodo] = useState<{ id: string; text: string } | null>(null);

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
  
  const handleToggleTodo = (id: string, list: 'in-progress' | 'backlog') => {
    const listSetter = list === 'in-progress' ? setInProgressTodos : setBacklogTodos;
    listSetter(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

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

  const handleDeleteTodo = (id: string, list: 'in-progress' | 'backlog') => {
    const listSetter = list === 'in-progress' ? setInProgressTodos : setBacklogTodos;
    listSetter(prev => prev.filter(todo => todo.id !== id));
  };

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
  
  const handleClearCompleted = () => {
    setInProgressTodos(prev => prev.filter(t => !t.completed));
    setBacklogTodos(prev => prev.filter(t => !t.completed));
  };

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
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMoveTodo(todo.id, listType)}>
                      {listType === 'in-progress' ? <ArrowDown className="h-4 w-4" title="Move to Backlog" /> : <ArrowUp className="h-4 w-4" title="Move to In Progress" />}
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
    <Card className="col-span-1 flex flex-col">
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
