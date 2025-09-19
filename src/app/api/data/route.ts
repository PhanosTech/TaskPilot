
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { projects as initialProjects, tasks as initialTasks } from '@/lib/data';

const getDbPath = () => {
    // In production server environment, use DB_PATH env var.
    // Fallback to a local file for development if not set.
    const dbPath = process.env.DB_PATH || 'taskpilot.dev.db';
    // Resolve the path relative to the project root.
    return path.resolve(process.cwd(), dbPath);
};

export async function GET() {
    const dbPath = getDbPath();
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        // If the file doesn't exist, return the initial data.
        if (error.code === 'ENOENT') {
            const initialData = { projects: initialProjects, tasks: initialTasks };
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
        await fs.writeFile(dbPath, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
    }
}
