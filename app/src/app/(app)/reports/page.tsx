
"use client";

import { useState, useMemo, useContext } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { DataContext } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * @typedef {object} GroupedLogs
 * A type for structuring logs grouped by project name and then by task title.
 */
type GroupedLogs = {
  [projectName: string]: {
    [taskTitle: string]: {
      content: string;
      createdAt: string;
    }[];
  };
};

/**
 * @typedef {object} InProgressWork
 * A type for structuring data about tasks that are currently in progress.
 */
type InProgressWork = {
  projectName: string;
  taskTitle: string;
  taskDescription: string;
};

/**
 * @page ReportsPage
 * Displays reports on work logs and in-progress tasks. Allows users to filter
 * logs by project and date range, and export the results.
 * @returns {JSX.Element} The rendered reports page.
 */
export default function ReportsPage() {
  const { projects, tasks } = useContext(DataContext);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [exportText, setExportText] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [inProgressExportText, setInProgressExportText] = useState("");
  const [isInProgressExportDialogOpen, setIsInProgressExportDialogOpen] = useState(false);

  /**
   * Memoized computation of filtered logs based on the selected project and date range.
   */
  const filteredLogs = useMemo(() => tasks.flatMap(task => 
      task.logs.map(log => ({
        ...log,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'
      }))
    )
    .filter(log => {
      const logDate = new Date(log.createdAt);
      const isProjectMatch = selectedProjectId === 'all' || log.projectId === selectedProjectId;
      
      if (!dateRange?.from || !dateRange?.to) {
        return isProjectMatch;
      }

      // Set time to end of day for 'to' date to include all logs on that day
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      const isDateMatch = logDate >= dateRange.from && logDate <= toDate;
      
      return isProjectMatch && isDateMatch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [tasks, projects, selectedProjectId, dateRange]);

  /**
   * Memoized computation of tasks that are currently "In Progress" for active projects.
   */
  const inProgressWork = useMemo(() => {
    const inProgressProjects = projects.filter(p => p.status === 'In Progress');
    const inProgressProjectIds = new Set(inProgressProjects.map(p => p.id));
    return tasks
      .filter(task => task.status === 'In Progress' && inProgressProjectIds.has(task.projectId))
      .map(task => ({
        ...task,
        projectName: projects.find(p => p.id === task.projectId)?.name || 'Unknown Project',
      }));
  }, [projects, tasks]);


  /**
   * Generates a formatted text report of the filtered work logs and opens the export dialog.
   */
  const handleExport = () => {
    const grouped: GroupedLogs = filteredLogs.reduce((acc, log) => {
      const { projectName, taskTitle } = log;
      if (!acc[projectName]) {
        acc[projectName] = {};
      }
      if (!acc[projectName][taskTitle]) {
        acc[projectName][taskTitle] = [];
      }
      acc[projectName][taskTitle].push({ content: log.content, createdAt: log.createdAt });
      return acc;
    }, {} as GroupedLogs);

    let output = "Work Log Report\n\n";
    for (const projectName in grouped) {
      output += `${projectName}\n`;
      for (const taskTitle in grouped[projectName]) {
        output += `    ${taskTitle}:\n`;
        grouped[projectName][taskTitle].forEach(log => {
          const date = new Date(log.createdAt).toLocaleDateString();
          output += `         * ${log.content} (${date})\n`;
        });
      }
      output += '\n';
    }

    setExportText(output);
    setIsExportDialogOpen(true);
  };
  
  /**
   * Generates a formatted text report of in-progress work and opens the export dialog.
   */
  const handleExportInProgress = () => {
    const groupedByProject: Record<string, InProgressWork[]> = inProgressWork.reduce((acc, work) => {
      if (!acc[work.projectName]) {
        acc[work.projectName] = [];
      }
      acc[work.projectName].push({
        projectName: work.projectName,
        taskTitle: work.title,
        taskDescription: work.description,
      });
      return acc;
    }, {} as Record<string, InProgressWork[]>);

    let output = "In Progress Work Update\n\n";
    for (const projectName in groupedByProject) {
      output += `${projectName}\n`;
      groupedByProject[projectName].forEach(item => {
        output += `  - ${item.taskTitle}: ${item.taskDescription}\n`;
      });
      output += '\n';
    }

    setInProgressExportText(output);
    setIsInProgressExportDialogOpen(true);
  };


  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>In Progress Work</CardTitle>
            <CardDescription>A list of all tasks currently in progress for active projects.</CardDescription>
          </div>
          <Button onClick={handleExportInProgress} disabled={inProgressWork.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inProgressWork.length > 0 ? (
                inProgressWork.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No tasks are currently in progress.</TableCell>
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
            <CardDescription>Select a project and date range to view work logs.</CardDescription>
          </div>
          <Button onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
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
          <CardDescription>A history of work logs based on your filters.</CardDescription>
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
                filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{log.projectName}</TableCell>
                    <TableCell>{log.taskTitle}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.content}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No logs found for the selected criteria.</TableCell>
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
              Copy the text below to export your filtered work logs.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={exportText}
            className="h-96 text-sm font-mono"
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isInProgressExportDialogOpen} onOpenChange={setIsInProgressExportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export In Progress Work</DialogTitle>
            <DialogDescription>
              Copy the text below to export your in-progress work.
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
