
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import { useEffect, useState } from 'react';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  const editorInstance = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    setEditor(editorInstance);
  }, [editorInstance]);


  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="prose dark:prose-invert max-w-none w-full h-full border rounded-md p-2">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
