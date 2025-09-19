
"use client";

import { useMemo } from "react";
import type { Block } from "@/lib/types";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface WysiwygEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

const safeJSONParse = (content?: string): Block[] | undefined => {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && (parsed.length === 0 || (parsed[0] && parsed[0].type))) {
      return parsed as Block[];
    }
    return [{ type: "paragraph", content }];
  } catch (error) {
    return [{ type: "paragraph", content }];
  }
};

export function WysiwygEditor({ initialContent, onChange }: WysiwygEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: useMemo(() => safeJSONParse(initialContent), [initialContent]),
  });

  return (
    <BlockNoteView 
      editor={editor} 
      theme={"light"}
      onChange={() => {
        onChange(JSON.stringify(editor.document));
      }}
    />
  );
}
