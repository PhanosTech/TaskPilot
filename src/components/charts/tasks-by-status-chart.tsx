
"use client";

import { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import type { Task, TaskStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TasksByStatusChartProps {
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  "To Do": "hsl(var(--muted-foreground) / 0.5)", 
  "In Progress": "hsl(var(--chart-3))",
  "Done": "hsl(var(--chart-2))", 
};

export function TasksByStatusChart({ tasks }: TasksByStatusChartProps) {
  const totalSubtasks = useMemo(() => {
    return tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  }, [tasks]);

  const chartData = useMemo(() => {
    const statusCounts = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<TaskStatus, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status as TaskStatus,
      value: count,
      fill: STATUS_COLORS[status as TaskStatus],
    }));
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Status</CardTitle>
        <CardDescription>A breakdown of tasks in this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value, name) => [`${value} tasks`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4 text-sm">
            <div className="font-medium">
              <p className="text-2xl">{tasks.length}</p>
              <p className="text-muted-foreground">Total Tasks</p>
            </div>
            <div className="font-medium">
              <p className="text-2xl">{totalSubtasks}</p>
              <p className="text-muted-foreground">Total Subtasks</p>
            </div>
             <div className="flex flex-col gap-2">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
