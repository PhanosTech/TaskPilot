
"use client";

import { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface NoteRendererProps {
  content: string;
}

const safeJSONParse = (content: string): Block[] | undefined => {
  if (!content) return undefined;
  try {
    return JSON.parse(content) as Block[];
  } catch (error) {
    // If parsing fails, treat it as legacy Markdown and wrap it in a block
    return [{ type: "paragraph", content }];
  }
};

export function NoteRenderer({ content }: NoteRendererProps) {
  const editor = useCreateBlockNote({
    initialContent: safeJSONParse(content),
  });

  return <BlockNoteView editor={editor} editable={false} />;
}
