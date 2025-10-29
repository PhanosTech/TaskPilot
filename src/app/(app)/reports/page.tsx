"use client";

import { useState, useMemo, useContext, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { subDays, format as formatDate } from "date-fns";
import { DataContext } from "@/context/data-context";
import { useTodoContext } from "@/context/todo-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * ReportsPage enhancements
 * - Added sort controls for the logs export (by project, task, date)
 * - Added export that captures a snapshot of current In-Progress and To-Do tasks
 *   so the exported report includes remaining work at the time of export.
 * - Export text is plain-text and Outlook-friendly (easy to copy/paste).
 * - Added comments and simple UI improvements for clarity on desktop.
 */

type InProgressWork = {
  projectName: string;
  taskTitle: string;
  taskDescription: string;
  status: string;
};

type CombinedLog = {
  id: string;
  kind: "project" | "todo";
  projectId?: string;
  groupLabel: string;
  itemName: string;
  content: string;
  createdAt: string;
  categoryName?: string;
};

type GroupedProjectLogs = {
  [projectName: string]: {
    [taskTitle: string]: {
      content: string;
      createdAt: string;
    }[];
  };
};

type GroupedTodoLogs = {
  [categoryName: string]: {
    [todoLabel: string]: {
      content: string;
      createdAt: string;
    }[];
  };
};

type ActiveTodoRow = {
  id: string;
  text: string;
  categoryName: string;
  isDone: boolean;
  createdAt: number;
};

type BacklogTodoGroup = {
  categoryName: string;
  todos: {
    id: string;
    text: string;
    isDone: boolean;
    createdAt: number;
  }[];
};

export default function ReportsPage() {
  const { projects, tasks } = useContext(DataContext);
  const { categories: todoCategories, activeTodos, backlogTodos } = useTodoContext();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  // Sorting options for logs export
  const [sortField, setSortField] = useState<"date" | "project" | "task">(
    "date",
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [exportText, setExportText] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [inProgressExportText, setInProgressExportText] = useState("");
  const [isInProgressExportDialogOpen, setIsInProgressExportDialogOpen] =
    useState(false);

  // Used for snapshotting remaining work at the time of report export
  const snapshotRef = useRef<{
    time: string;
    projectItems: InProgressWork[];
    activeTodos: ActiveTodoRow[];
    backlog: BacklogTodoGroup[];
  } | null>(
    null,
  );

  const projectNameMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const todoCategoryMap = useMemo(
    () => new Map(todoCategories.map((category) => [category.id, category.name])),
    [todoCategories],
  );

  const activeTodoRows = useMemo<ActiveTodoRow[]>(
    () =>
      activeTodos.map((todo) => ({
        id: todo.id,
        text: todo.text,
        categoryName:
          todoCategoryMap.get(todo.categoryId) || "Uncategorized",
        isDone: todo.isDone,
        createdAt: todo.createdAt,
      })),
    [activeTodos, todoCategoryMap],
  );

  const personalTodos = useMemo(() => {
    const seen = new Set<string>();
    const combined: typeof activeTodos = [];
    for (const todo of [...activeTodos, ...backlogTodos]) {
      if (seen.has(todo.id)) continue;
      seen.add(todo.id);
      combined.push(todo);
    }
    return combined;
  }, [activeTodos, backlogTodos]);

  const projectLogs = useMemo<CombinedLog[]>(
    () =>
      tasks.flatMap((task) =>
        task.logs.map((log) => {
          const projectName =
            projectNameMap.get(task.projectId) || "Unknown Project";
          return {
            id: log.id,
            kind: "project" as const,
            projectId: task.projectId,
            groupLabel: projectName,
            itemName: task.title,
            content: log.content,
            createdAt: new Date(log.createdAt).toISOString(),
            categoryName: projectName,
          };
        }),
      ),
    [tasks, projectNameMap],
  );

  const todoLogs = useMemo<CombinedLog[]>(
    () =>
      personalTodos.flatMap((todo) => {
        const categoryName =
          todoCategoryMap.get(todo.categoryId) || "Uncategorized";
        return todo.logs.map((log) => ({
          id: `todo-${todo.id}-${log.id}`,
          kind: "todo" as const,
          projectId: "personal-todos",
          groupLabel: categoryName,
          itemName: todo.text,
          content: log.content,
          createdAt: new Date(log.createdAt).toISOString(),
          categoryName,
        }));
      }),
    [personalTodos, todoCategoryMap],
  );

  const combinedLogs = useMemo(
    () => [...projectLogs, ...todoLogs],
    [projectLogs, todoLogs],
  );

  const filteredLogs = useMemo(() => {
    const list = combinedLogs.filter((log) => {
      const logDate = new Date(log.createdAt);
      const matchesSelection =
        selectedProjectId === "all"
          ? true
          : selectedProjectId === "personal-todos"
            ? log.kind === "todo"
            : log.kind === "project" && log.projectId === selectedProjectId;

      if (!matchesSelection) {
        return false;
      }

      if (!dateRange?.from || !dateRange?.to) {
        return true;
      }

      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      return logDate >= dateRange.from && logDate <= toDate;
    });

    const compareByDate = (a: CombinedLog, b: CombinedLog) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    let comparator: (a: CombinedLog, b: CombinedLog) => number;

    if (sortField === "project") {
      comparator = (a, b) => {
        const cmp = a.groupLabel.localeCompare(b.groupLabel);
        if (cmp !== 0) return cmp;
        return compareByDate(a, b);
      };
    } else if (sortField === "task") {
      comparator = (a, b) => {
        const cmp = a.itemName.localeCompare(b.itemName);
        if (cmp !== 0) return cmp;
        return compareByDate(a, b);
      };
    } else {
      comparator = compareByDate;
    }

    return list.sort((a, b) => {
      const result = comparator(a, b);
      return sortDir === "desc" ? -result : result;
    });
  }, [combinedLogs, selectedProjectId, dateRange, sortField, sortDir]);

  const backlogTodoGroups = useMemo<BacklogTodoGroup[]>(() => {
    const grouped = new Map<string, BacklogTodoGroup["todos"]>();
    backlogTodos.forEach((todo) => {
      const categoryName =
        todoCategoryMap.get(todo.categoryId) || "Uncategorized";
      const existing = grouped.get(categoryName) ?? [];
      existing.push({
        id: todo.id,
        text: todo.text,
        isDone: todo.isDone,
        createdAt: todo.createdAt,
      });
      grouped.set(categoryName, existing);
    });

    return Array.from(grouped.entries())
      .map(([categoryName, todos]) => ({
        categoryName,
        todos: todos.sort((a, b) => b.createdAt - a.createdAt),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [backlogTodos, todoCategoryMap]);

  const inProgressWork = useMemo(() => {
    // capture both 'In Progress' and 'To Do' as remaining work snapshot candidates
    const remainingStatuses = new Set(["In Progress", "To Do"]);
    const activeProjectIds = new Set(projects.map((p) => p.id));
    return tasks
      .filter(
        (task) =>
          remainingStatuses.has(task.status) &&
          activeProjectIds.has(task.projectId),
      )
      .map((task) => ({
        projectName:
          projects.find((p) => p.id === task.projectId)?.name ||
          "Unknown Project",
        taskTitle: task.title,
        taskDescription: task.description,
        status: task.status,
      }));
  }, [projects, tasks]);

  // Format logs export for Outlook-friendly email. The export includes:
  // - Header with date range & project selection
  // - Work logs grouped by project and task
  // - Optional snapshot of remaining work (in-progress & todos) when requested
  const generateExportText = (includeSnapshot = false) => {
    const headerFrom = dateRange?.from
      ? formatDate(dateRange.from, "yyyy-MM-dd")
      : "N/A";
    const headerTo = dateRange?.to
      ? formatDate(dateRange.to, "yyyy-MM-dd")
      : "N/A";
    const projectLabel =
      selectedProjectId === "all"
        ? "All Projects & Todos"
        : selectedProjectId === "personal-todos"
          ? "In-Progress Todos"
          : projectNameMap.get(selectedProjectId) || "Unknown Project";

    let output = `Work Log Report\nDate Range: ${headerFrom} → ${headerTo}\nSelection: ${projectLabel}\nGenerated: ${new Date().toLocaleString()}\n\n`;

    const projectLogsForExport = filteredLogs.filter(
      (log) => log.kind === "project",
    );
    const todoLogsForExport = filteredLogs.filter((log) => log.kind === "todo");

    if (projectLogsForExport.length > 0) {
      const groupedProjects = projectLogsForExport.reduce(
        (acc, log) => {
          if (!acc[log.groupLabel]) acc[log.groupLabel] = {};
          if (!acc[log.groupLabel][log.itemName]) {
            acc[log.groupLabel][log.itemName] = [];
          }
          acc[log.groupLabel][log.itemName].push({
            content: log.content,
            createdAt: log.createdAt,
          });
          return acc;
        },
        {} as GroupedProjectLogs,
      );

      output += "=== Project Work Logs ===\n";
      for (const projectName of Object.keys(groupedProjects).sort()) {
        output += `${projectName}\n`;
        const tasksForProject = groupedProjects[projectName];
        for (const taskTitle of Object.keys(tasksForProject).sort()) {
          output += `  ${taskTitle}\n`;
          tasksForProject[taskTitle].forEach((log) => {
            const date = new Date(log.createdAt).toLocaleString();
            output += `    - ${log.content} (${date})\n`;
          });
        }
        output += "\n";
      }
    }

    if (todoLogsForExport.length > 0) {
      const groupedTodos = todoLogsForExport.reduce(
        (acc, log) => {
          if (!acc[log.groupLabel]) acc[log.groupLabel] = {};
          if (!acc[log.groupLabel][log.itemName]) {
            acc[log.groupLabel][log.itemName] = [];
          }
          acc[log.groupLabel][log.itemName].push({
            content: log.content,
            createdAt: log.createdAt,
          });
          return acc;
        },
        {} as GroupedTodoLogs,
      );

      output += "=== Personal Todo Logs ===\n";
      for (const categoryName of Object.keys(groupedTodos).sort()) {
        output += `${categoryName}\n`;
        const todosForCategory = groupedTodos[categoryName];
        for (const todoLabel of Object.keys(todosForCategory).sort()) {
          output += `  ${todoLabel}\n`;
          todosForCategory[todoLabel].forEach((log) => {
            const date = new Date(log.createdAt).toLocaleString();
            output += `    - ${log.content} (${date})\n`;
          });
        }
        output += "\n";
      }
    }

    if (projectLogsForExport.length === 0 && todoLogsForExport.length === 0) {
      output += "No work logs found for the current filters.\n\n";
    }

    output += "=== Active In-Progress Todos ===\n";
    if (activeTodoRows.length === 0) {
      output += "No active personal todos.\n\n";
    } else {
      activeTodoRows.forEach((todo) => {
        const statusLabel = todo.isDone ? "done" : "active";
        output += `* ${todo.categoryName} — ${todo.text} (${statusLabel})\n`;
      });
      output += "\n";
    }

    output += "=== Todo Backlog ===\n";
    if (backlogTodoGroups.length === 0) {
      output += "Backlog is empty.\n\n";
    } else {
      backlogTodoGroups.forEach((group) => {
        output += `${group.categoryName}\n`;
        group.todos.forEach((todo) => {
          output += `  - ${todo.text}${todo.isDone ? " (done)" : ""}\n`;
        });
        output += "\n";
      });
    }

    if (includeSnapshot) {
      // take a snapshot of remaining work at this moment
      const now = new Date();
      const snapshotItems = inProgressWork;
      snapshotRef.current = {
        time: now.toISOString(),
        projectItems: snapshotItems,
        activeTodos: activeTodoRows,
        backlog: backlogTodoGroups,
      };

      output += "=== Remaining Work Snapshot ===\n";
      output += `Snapshot time: ${now.toLocaleString()}\n\n`;
      if (snapshotItems.length === 0) {
        output += "No remaining work at snapshot time.\n\n";
      } else {
        for (const item of snapshotItems) {
          output += `* [${item.status}] ${item.projectName} — ${item.taskTitle}\n    ${item.taskDescription || "(no description)"}\n\n`;
        }
      }
    }

    // Footer with suggested copy/paste note
    output += "=== End of Report ===\n";
    output +=
      "Tip: Copy the text above and paste into Outlook (plain text or email body) — images are not included.\n";

    return output;
  };

  const handleExport = () => {
    const text = generateExportText(false);
    setExportText(text);
    setIsExportDialogOpen(true);
  };

  const handleExportInProgress = () => {
    // export logs + remaining snapshot Inline
    const text = generateExportText(true);
    setInProgressExportText(text);
    setIsInProgressExportDialogOpen(true);
  };

  const hasSnapshotContent =
    inProgressWork.length > 0 ||
    activeTodoRows.length > 0 ||
    backlogTodoGroups.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {/* Quick actions: export logs or export logs + remaining-work snapshot */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort Logs By</label>
          <Select
            value={sortField}
            onValueChange={(v) => setSortField(v as any)}
          >
            <SelectTrigger>
              <SelectValue>{sortField}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
            <SelectTrigger>
              <SelectValue>{sortDir}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest first</SelectItem>
              <SelectItem value="asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex gap-2">
          <Button onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button
            onClick={handleExportInProgress}
            disabled={!hasSnapshotContent}
          >
            <Download className="mr-2 h-4 w-4" />
            Export With Snapshot
          </Button>
        </div>
      </div>

      <Card className="mt-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>In Progress & To-Do Work</CardTitle>
            <CardDescription>
              A list of tasks currently In Progress or To Do (snapshotable).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inProgressWork.length > 0 ? (
                inProgressWork.map((task, idx) => (
                  <TableRow
                    key={`${task.projectName}-${task.taskTitle}-${idx}`}
                  >
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>{task.taskTitle}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.taskDescription}
                    </TableCell>
                    <TableCell>{task.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No remaining work items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active In-Progress Todos</CardTitle>
            <CardDescription>
              Snapshot of personal todos you have in progress.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Todo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTodoRows.length > 0 ? (
                activeTodoRows.map((todo) => (
                  <TableRow key={todo.id}>
                    <TableCell>{todo.categoryName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {todo.text}
                    </TableCell>
                    <TableCell>{todo.isDone ? "Done" : "Active"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No active personal todos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todo Backlog by Category</CardTitle>
          <CardDescription>
            Every backlog todo grouped by its category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backlogTodoGroups.length > 0 ? (
            <div className="space-y-4">
              {backlogTodoGroups.map((group) => (
                <div
                  key={group.categoryName}
                  className="space-y-2 rounded-md border border-border/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{group.categoryName}</h3>
                    <span className="text-xs text-muted-foreground">
                      {group.todos.length}{" "}
                      {group.todos.length === 1 ? "todo" : "todos"}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {group.todos.map((todo) => (
                      <li key={todo.id}>
                        {todo.text}
                        {todo.isDone ? " (done)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Backlog is empty.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>
              Select a project and date range to filter the work logs.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="personal-todos">In-Progress Todos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Logs</CardTitle>
          <CardDescription>
            A history of work logs based on your filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category / Project</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Log</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.kind === "project" ? "Project Task" : "Personal Todo"}
                    </TableCell>
                    <TableCell>{log.groupLabel}</TableCell>
                    <TableCell>{log.itemName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.content}
                    </TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Work Logs</DialogTitle>
            <DialogDescription>
              Copy the text below to export your filtered work logs. (Plain text
              for Outlook)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={exportText}
            className="h-96 text-sm font-mono"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInProgressExportDialogOpen}
        onOpenChange={setIsInProgressExportDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Logs + Remaining Work Snapshot</DialogTitle>
            <DialogDescription>
              Copy the text below to export your logs and remaining work at
              snapshot time.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={inProgressExportText}
            className="h-96 text-sm font-mono"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
