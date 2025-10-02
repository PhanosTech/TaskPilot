
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const LOCAL_STORAGE_KEY = "taskpilot-scratchpad";

export function Scratchpad() {
  const [content, setContent] = useState("");

  useEffect(() => {
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    localStorage.setItem(LOCAL_STORAGE_KEY, newContent);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scratchpad</CardTitle>
        <CardDescription>
          Jot down quick notes here. They are saved locally and will persist between sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your notes here..."
          value={content}
          onChange={handleChange}
          className="h-32 resize-y"
        />
      </CardContent>
    </Card>
  );
}
