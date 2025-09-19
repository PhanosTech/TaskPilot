
"use client";

import { useState, useMemo, useContext } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Project, ProjectStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataContext } from "@/context/data-context";

const statusOrder: ProjectStatus[] = ["In Progress", "Backlog", "Done", "Archived"];

export default function ProjectsPage() {
  const { projects, tasks, createProject } = useContext(DataContext);
  const [showArchived, setShowArchived] = useState(false);

  const projectsWithProgress = useMemo(() => projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const totalStoryPoints = projectTasks.reduce((sum, task) => sum + task.storyPoints, 0);
    
    const completedStoryPoints = projectTasks.reduce((sum, task) => {
      if (task.status === 'Done') {
        return sum + task.storyPoints;
      }

      const totalSubtaskPoints = task.subtasks.reduce((subSum, st) => subSum + st.storyPoints, 0);
      if (totalSubtaskPoints === 0) {
        return sum; // Not 'Done' and no subtasks means 0 points contributed
      }

      const completedSubtaskPoints = task.subtasks
        .filter(st => st.isCompleted)
        .reduce((subSum, st) => subSum + st.storyPoints, 0);

      const taskProgress = completedSubtaskPoints / totalSubtaskPoints;
      return sum + (task.storyPoints * taskProgress);
    }, 0);
    
    const progress = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;
    
    return { ...project, taskCount: projectTasks.length, progress };
  }), [projects, tasks]);

  const filteredProjects = useMemo(() => {
    const sorted = [...projectsWithProgress].sort((a, b) => {
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });
    if (showArchived) {
      return sorted;
    }
    return sorted.filter(p => p.status !== 'Archived');
  }, [projectsWithProgress, showArchived]);


  const groupedProjects = useMemo(() => {
    const groups: Record<ProjectStatus, typeof filteredProjects> = {
      'In Progress': [],
      'Backlog': [],
      'Done': [],
      'Archived': [],
    };
    filteredProjects.forEach(p => {
      if (p.status in groups) {
        groups[p.status].push(p);
      }
    });
    return groups;
  }, [filteredProjects]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived">Show Archived</Label>
          </div>
          <CreateProjectDialog onCreateProject={createProject} />
        </div>
      </div>
      
      <div className="flex flex-col gap-8">
        {statusOrder.map(status => {
          if (status === 'Archived' && !showArchived) return null;

          const projectGroup = groupedProjects[status];
          if (!projectGroup || projectGroup.length === 0) return null;
          
          return (
            <div key={status}>
              <h2 className="text-xl font-semibold mb-4">{status}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectGroup.map(project => (
                  <Link href={`/projects/${project.id}`} key={project.id}>
                    <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="pr-4">{project.name}</CardTitle>
                          <Badge variant={project.status === 'Done' ? 'default' : 'outline'}>{project.status}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>{Math.round(project.progress)}%</span>
                        </div>
                        <Progress value={project.progress} aria-label={`${project.progress}% complete`} />
                      </CardContent>
                      <CardFooter>
                        <p className="text-sm text-muted-foreground">{project.taskCount} tasks</p>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
