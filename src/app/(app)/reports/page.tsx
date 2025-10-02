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

type GroupedLogs = {
  [projectName: string]: {
    [taskTitle: string]: {
      content: string;
      createdAt: string;
    }[];
  };
};

type InProgressWork = {
  projectName: string;
  taskTitle: string;
  taskDescription: string;
  status: string;
};

export default function ReportsPage() {
  const { projects, tasks } = useContext(DataContext);
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
  const snapshotRef = useRef<{ time: string; items: InProgressWork[] } | null>(
    null,
  );

  // flatten logs and attach metadata
  const flattenedLogs = useMemo(
    () =>
      tasks.flatMap((task) =>
        task.logs.map((log) => ({
          ...log,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName:
            projects.find((p) => p.id === task.projectId)?.name ||
            "Unknown Project",
        })),
      ),
    [tasks, projects],
  );

  const filteredLogs = useMemo(() => {
    const list = flattenedLogs.filter((log) => {
      const logDate = new Date(log.createdAt);
      const isProjectMatch =
        selectedProjectId === "all" || log.projectId === selectedProjectId;

      if (!dateRange?.from || !dateRange?.to) {
        return isProjectMatch;
      }

      // Set time to end of day for 'to' date to include all logs on that day
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      const isDateMatch = logDate >= dateRange.from && logDate <= toDate;

      return isProjectMatch && isDateMatch;
    });

    // sort by date descending by default
    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });

    // if requested, stable sort by project or task as secondary key
    if (sortField === "project") {
      list.sort((a, b) => {
        const cmp = a.projectName.localeCompare(b.projectName);
        if (cmp !== 0) return sortDir === "desc" ? -cmp : cmp;
        return a.taskTitle.localeCompare(b.taskTitle);
      });
    } else if (sortField === "task") {
      list.sort((a, b) => {
        const cmp = a.taskTitle.localeCompare(b.taskTitle);
        if (cmp !== 0) return sortDir === "desc" ? -cmp : cmp;
        return a.projectName.localeCompare(b.projectName);
      });
    }

    return list;
  }, [flattenedLogs, selectedProjectId, dateRange, sortField, sortDir]);

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
        ? "All Projects"
        : projects.find((p) => p.id === selectedProjectId)?.name ||
          "Unknown Project";

    let output = `Work Log Report\nDate Range: ${headerFrom} → ${headerTo}\nProject: ${projectLabel}\nGenerated: ${new Date().toLocaleString()}\n\n`;

    // Group logs by project -> task
    const grouped: GroupedLogs = filteredLogs.reduce((acc, log) => {
      const { projectName, taskTitle } = log;
      if (!acc[projectName]) acc[projectName] = {};
      if (!acc[projectName][taskTitle]) acc[projectName][taskTitle] = [];
      acc[projectName][taskTitle].push({
        content: log.content,
        createdAt: log.createdAt,
      });
      return acc;
    }, {} as GroupedLogs);

    // Add sortable output: provide a table-like, but plain text structure
    output += "=== Work Logs ===\n";
    for (const projectName of Object.keys(grouped)) {
      output += `${projectName}\n`;
      const tasksForProject = grouped[projectName];
      for (const taskTitle of Object.keys(tasksForProject)) {
        output += `  ${taskTitle}\n`;
        tasksForProject[taskTitle].forEach((log) => {
          const date = new Date(log.createdAt).toLocaleString();
          // Use bullet points and indentation for readability in email clients like Outlook
          output += `    - ${log.content} (${date})\n`;
        });
      }
      output += "\n";
    }

    if (includeSnapshot) {
      // take a snapshot of remaining work at this moment
      const now = new Date();
      const snapshotItems = inProgressWork;
      snapshotRef.current = { time: now.toISOString(), items: snapshotItems };

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
            disabled={inProgressWork.length === 0}
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
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Log</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.projectName}</TableCell>
                    <TableCell>{log.taskTitle}</TableCell>
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
                  <TableCell colSpan={4} className="text-center">
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
