
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
    projects as initialProjects,
    tasks as initialTasks,
    categories as initialCategories,
} from '@/lib/data';
import type { Project, ProjectCategory, Task } from '@/lib/types';
import { initialTodoState, type TodoState } from '@/lib/todo-storage';

const getDbPath = () => {
    // In production server environment, use DB_PATH env var.
    // Fallback to a local file for development if not set.
    const dbPath = process.env.DB_PATH || 'taskpilot.dev.db';
    // Resolve the path relative to the project root.
    return path.resolve(process.cwd(), dbPath);
};

type StoredData = {
    projects: Project[];
    tasks: Task[];
    categories: ProjectCategory[];
    personalTodos: TodoState;
    scratchpad: string;
};

const normalizeProjects = (value: unknown): Project[] => {
    const projects = Array.isArray(value) ? (value as Project[]) : initialProjects;
    return projects.map((project) => ({
        ...project,
        categoryId: project.categoryId || 'cat-default',
    }));
};

const normalizeCategories = (value: unknown): ProjectCategory[] => {
    const categories = Array.isArray(value) ? (value as ProjectCategory[]) : initialCategories;
    return categories.map((category) => ({
        ...category,
    }));
};

const normalizeTasks = (value: unknown): Task[] => {
    const tasks = Array.isArray(value) ? (value as Task[]) : initialTasks;
    return tasks.map((task) => ({
        ...task,
    }));
};

const normalizeTodoState = (value: unknown): TodoState => {
    const raw = (value ?? initialTodoState) as Partial<TodoState>;
    const categories = Array.isArray(raw.categories) ? raw.categories : [];
    const todos = Array.isArray(raw.todos) ? raw.todos : [];
    const todoIds = new Set(todos.map((todo) => todo.id));
    const activeOrder = Array.isArray(raw.activeOrder)
        ? raw.activeOrder.filter((id): id is string => typeof id === 'string' && todoIds.has(id))
        : [];

    return {
        categories: categories.map((category) => ({ ...category })),
        todos: todos.map((todo) => ({ ...todo })),
        activeOrder: [...activeOrder],
    };
};

const normalizeData = (value: unknown): StoredData => {
    const raw = (value ?? {}) as Partial<StoredData>;
    return {
        projects: normalizeProjects(raw.projects),
        tasks: normalizeTasks(raw.tasks),
        categories: normalizeCategories(raw.categories),
        personalTodos: normalizeTodoState(raw.personalTodos),
        scratchpad: typeof raw.scratchpad === 'string' ? raw.scratchpad : '',
    };
};

export async function GET() {
    const dbPath = getDbPath();
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        const jsonData = JSON.parse(data);
        const normalized = normalizeData(jsonData);
        return NextResponse.json(normalized);
    } catch (error) {
        // If the file doesn't exist, return the initial data.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            const initialData = normalizeData({
                projects: initialProjects,
                tasks: initialTasks,
                categories: initialCategories,
                personalTodos: initialTodoState,
                scratchpad: '',
            });
            // Also write it to the file so it's created for the next time.
            await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
            return NextResponse.json(initialData);
        }
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const dbPath = getDbPath();
    try {
        const body = await request.json();
        let existing: StoredData;
        try {
            const raw = await fs.readFile(dbPath, 'utf8');
            existing = normalizeData(JSON.parse(raw));
        } catch (readError) {
            if ((readError as NodeJS.ErrnoException).code === 'ENOENT') {
                existing = normalizeData({
                    projects: initialProjects,
                    tasks: initialTasks,
                    categories: initialCategories,
                    personalTodos: initialTodoState,
                    scratchpad: '',
                });
            } else {
                throw readError;
            }
        }

        const hasOwn = (key: keyof StoredData) =>
            Object.prototype.hasOwnProperty.call(body, key);

        const merged = normalizeData({
            projects: hasOwn('projects') ? body.projects : existing.projects,
            tasks: hasOwn('tasks') ? body.tasks : existing.tasks,
            categories: hasOwn('categories') ? body.categories : existing.categories,
            personalTodos: hasOwn('personalTodos') ? body.personalTodos : existing.personalTodos,
            scratchpad: hasOwn('scratchpad') ? body.scratchpad : existing.scratchpad,
        });

        await fs.writeFile(dbPath, JSON.stringify(merged, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
    }
}
