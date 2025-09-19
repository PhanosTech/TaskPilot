
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import { useEffect, useState } from 'react';

interface NoteRendererProps {
  content: string;
}

export function NoteRenderer({ content }: NoteRendererProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  const editorInstance = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: false,
  });

  useEffect(() => {
    setEditor(editorInstance);
  }, [editorInstance]);


  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="prose dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
