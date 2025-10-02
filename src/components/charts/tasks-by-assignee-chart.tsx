
"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { Task, TaskStatus } from "@/lib/types";

interface TasksByAssigneeChartProps {
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  "To Do": "hsl(var(--chart-1))",
  "In Progress": "hsl(var(--chart-2))",
  "Done": "hsl(var(--chart-3))",
};

export function TasksByAssigneeChart({ tasks }: TasksByAssigneeChartProps) {
  const chartData = useMemo(() => {
    // This is a placeholder for assignee data.
    // In a real app, you would have an `assignee` field on your tasks.
    const assignees = ["Alice", "Bob", "Charlie", "David"];
    
    return assignees.map(assignee => {
      const assigneeTasks = tasks.filter((_, index) => assignees[index % assignees.length] === assignee);
      return {
        name: assignee,
        "To Do": assigneeTasks.filter(t => t.status === "To Do").length,
        "In Progress": assigneeTasks.filter(t => t.status === "In Progress").length,
        "Done": assigneeTasks.filter(t => t.status === "Done").length,
      };
    });
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
        />
        <Legend iconSize={10} />
        <Bar dataKey="To Do" stackId="a" fill={STATUS_COLORS["To Do"]} />
        <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS["In Progress"]} />
        <Bar dataKey="Done" stackId="a" fill={STATUS_COLORS["Done"]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
