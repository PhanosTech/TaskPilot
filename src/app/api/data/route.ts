
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
    projects as initialProjects,
    tasks as initialTasks,
    categories as initialCategories,
    quickTasks as initialQuickTasks,
} from '@/lib/data';
import type { Project, ProjectCategory, Task, QuickTask, TaskStatus } from '@/lib/types';
import { initialTodoState, type TodoLog, type TodoState, type TodoItem } from '@/lib/todo-storage';

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
    quickTasks: QuickTask[];
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
        link: typeof (task as { link?: unknown }).link === 'string' ? (task as { link: string }).link : '',
    }));
};

const normalizeQuickTasks = (value: unknown): QuickTask[] => {
    const tasks = Array.isArray(value) ? (value as QuickTask[]) : initialQuickTasks;
    const allowedPriorities: QuickTask['priority'][] = ['High', 'Medium', 'Low'];
    const allowedStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
    return tasks.map((task) => {
        const rawDescription =
            typeof (task as { description?: unknown }).description === 'string'
                ? (task as { description: string }).description
                : '';
        const description = rawDescription.trim();
        const rawTitle =
            typeof (task as { title?: unknown }).title === 'string'
                ? (task as { title: string }).title
                : '';
        const title = rawTitle.trim() || description || 'Quick task';
        const rawStatus = (task as { status?: unknown }).status;
        const status = allowedStatuses.includes(rawStatus as TaskStatus)
            ? (rawStatus as TaskStatus)
            : 'To Do';
        const points =
            typeof (task as { points?: unknown }).points === 'number'
                ? Math.max(1, Math.min(5, Math.round((task as { points: number }).points)))
                : 1;
        const priority = allowedPriorities.includes((task as { priority?: unknown }).priority as QuickTask['priority'])
            ? ((task as { priority: QuickTask['priority'] }).priority)
            : 'Low';
        return {
            ...task,
            points,
            priority,
            status,
            isDone:
                status === 'Done' || Boolean((task as { isDone?: unknown }).isDone),
            title,
            description,
            logs: Array.isArray(task.logs)
                ? task.logs.map((log) => ({
                      id:
                          typeof (log as { id?: unknown }).id === 'string'
                              ? (log as { id: string }).id
                              : `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      content:
                          typeof (log as { content?: unknown }).content === 'string'
                              ? (log as { content: string }).content
                              : '',
                      createdAt:
                          typeof (log as { createdAt?: unknown }).createdAt === 'string'
                              ? (log as { createdAt: string }).createdAt
                              : new Date().toISOString(),
                  })).filter((log) => !!log.content)
                : [],
            link:
                typeof (task as { link?: unknown }).link === 'string'
                    ? (task as { link: string }).link
                    : '',
        };
    });
};

const normalizeTodoLogs = (value: unknown): TodoLog[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((log) => {
            if (!log || typeof log !== 'object') {
                return null;
            }
            const id = typeof (log as { id?: unknown }).id === 'string'
                ? (log as { id: string }).id
                : `log-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const content = typeof (log as { content?: unknown }).content === 'string'
                ? (log as { content: string }).content
                : '';
            const createdAt = typeof (log as { createdAt?: unknown }).createdAt === 'number'
                ? (log as { createdAt: number }).createdAt
                : Date.now();
            if (!content) {
                return null;
            }
            return { id, content, createdAt };
        })
        .filter((log): log is TodoLog => !!log);
};

const normalizeTodoState = (value: unknown): TodoState => {
    const raw = (value ?? initialTodoState) as Partial<TodoState>;
    const categories = Array.isArray(raw.categories) ? raw.categories : [];
    const todos = Array.isArray(raw.todos) ? raw.todos : [];
    const normalizedTodos: TodoItem[] = [];
    for (const todo of todos) {
        if (!todo || typeof todo !== 'object') {
            continue;
        }
        const id = typeof (todo as { id?: unknown }).id === 'string'
            ? (todo as { id: string }).id
            : `todo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const text = typeof (todo as { text?: unknown }).text === 'string'
            ? (todo as { text: string }).text
            : '';
        const categoryId = typeof (todo as { categoryId?: unknown }).categoryId === 'string'
            ? (todo as { categoryId: string }).categoryId
            : 'cat-default';
        const status = (todo as { status?: unknown }).status === 'active' ? 'active' : 'backlog';
        const isDone = Boolean((todo as { isDone?: unknown }).isDone);
        const createdAt = typeof (todo as { createdAt?: unknown }).createdAt === 'number'
            ? (todo as { createdAt: number }).createdAt
            : Date.now();
        const notes = typeof (todo as { notes?: unknown }).notes === 'string'
            ? (todo as { notes: string }).notes
            : '';
        const logs = normalizeTodoLogs((todo as { logs?: unknown }).logs);
        const link = typeof (todo as { link?: unknown }).link === 'string'
            ? (todo as { link: string }).link
            : '';
        normalizedTodos.push({
            id,
            text,
            categoryId,
            status,
            isDone,
            createdAt,
            notes,
            logs,
            link,
        });
    }

    const todoIds = new Set(normalizedTodos.map((todo) => todo.id));
    const activeOrder = Array.isArray(raw.activeOrder)
        ? raw.activeOrder.filter((id): id is string => typeof id === 'string' && todoIds.has(id))
        : [];

    return {
        categories: categories.map((category) => ({ ...category })),
        todos: normalizedTodos,
        activeOrder: [...activeOrder],
    };
};

const normalizeData = (value: unknown): StoredData => {
    const raw = (value ?? {}) as Partial<StoredData>;
    return {
        projects: normalizeProjects(raw.projects),
        tasks: normalizeTasks(raw.tasks),
        quickTasks: normalizeQuickTasks(raw.quickTasks),
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
                quickTasks: initialQuickTasks,
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
                    quickTasks: initialQuickTasks,
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
            quickTasks: hasOwn('quickTasks') ? body.quickTasks : existing.quickTasks,
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
