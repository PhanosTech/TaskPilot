
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
  const { totalStoryPoints, chartData, totalTasks, totalSubtasks } = useMemo(() => {
    const statusPoints: Record<TaskStatus, number> = {
      "To Do": 0,
      "In Progress": 0,
      "Done": 0,
    };
    
    let totalPoints = 0;

    tasks.forEach(task => {
      totalPoints += task.storyPoints;
      
      if (task.status === 'Done') {
        statusPoints['Done'] += task.storyPoints;
        return;
      }
      
      const totalSubtaskPoints = task.subtasks.reduce((sum, st) => sum + st.storyPoints, 0);
      
      if (task.status === 'In Progress' || (task.status === 'To Do' && totalSubtaskPoints > 0)) {
        const completedSubtaskPoints = task.subtasks
          .filter(st => st.isCompleted)
          .reduce((sum, st) => sum + st.storyPoints, 0);

        if (totalSubtaskPoints > 0) {
          const progressRatio = completedSubtaskPoints / totalSubtaskPoints;
          const donePoints = task.storyPoints * progressRatio;
          const inProgressPoints = task.storyPoints * (1 - progressRatio);

          statusPoints['Done'] += donePoints;
          
          if (completedSubtaskPoints > 0 && completedSubtaskPoints < totalSubtaskPoints) {
            statusPoints['In Progress'] += inProgressPoints;
          } else if (completedSubtaskPoints === 0) {
            statusPoints[task.status] += inProgressPoints;
          }
        } else {
          statusPoints[task.status] += task.storyPoints;
        }
      } else {
        statusPoints[task.status] += task.storyPoints;
      }
    });

    const finalChartData = (Object.entries(statusPoints) as [TaskStatus, number][])
      .filter(([, points]) => points > 0)
      .map(([status, points]) => ({
        name: status,
        value: parseFloat(points.toFixed(2)),
        fill: STATUS_COLORS[status],
      }));
    
    const totalSubtasksCount = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);

    return { 
      totalStoryPoints: totalPoints, 
      chartData: finalChartData,
      totalTasks: tasks.length,
      totalSubtasks: totalSubtasksCount
    };
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Status</CardTitle>
        <CardDescription>A breakdown of task effort in this project.</CardDescription>
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
                  formatter={(value, name) => [`${value} story points`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4 text-sm">
            <div className="font-medium">
              <p className="text-2xl">{totalStoryPoints}</p>
              <p className="text-muted-foreground">Total Story Points</p>
            </div>
            <div className="font-medium">
              <p className="text-2xl">{totalTasks} / {totalSubtasks}</p>
              <p className="text-muted-foreground">Tasks / Subtasks</p>
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
