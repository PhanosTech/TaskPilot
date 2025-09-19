
"use client";

import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { DataContext } from "@/context/data-context";

export default function TestPage() {
  const [log, setLog] = useState<string[]>([]);
  const { createProject } = useContext(DataContext);

  const testCreateProject = () => {
    const projectName = `Test Project ${Date.now()}`;
    createProject({ name: projectName });
    setLog(prevLog => [...prevLog, `Created project: ${projectName}`]);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Frontend Test Page</h1>
      <div className="flex gap-4">
        <Button onClick={testCreateProject}>Test Create Project</Button>
      </div>
      <pre className="bg-gray-100 p-4 rounded-lg">
        {log.join("\n")}
      </pre>
    </div>
  );
}
