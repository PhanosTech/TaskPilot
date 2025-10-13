
"use client";

import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTodoContext } from "@/context/todo-context";

export function Scratchpad() {
  const { scratchpadContent, updateScratchpad, isHydrated } = useTodoContext();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateScratchpad(event.target.value);
    },
    [updateScratchpad],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scratchpad</CardTitle>
        <CardDescription>
          Jot down quick notes here. Your notes are saved to the TaskPilot
          workspace so they follow you between browsers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your notes here..."
          value={scratchpadContent}
          onChange={handleChange}
          className="h-32 resize-y"
          disabled={!isHydrated}
        />
      </CardContent>
    </Card>
  );
}
