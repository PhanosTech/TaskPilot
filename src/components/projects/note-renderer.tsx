
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface NoteRendererProps {
  content: string;
}

export function NoteRenderer({ content }: NoteRendererProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: false,
  });

  return (
    <div className="prose dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
