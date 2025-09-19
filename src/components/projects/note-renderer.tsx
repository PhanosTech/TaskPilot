
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

interface NoteRendererProps {
  content: string;
}

export function NoteRenderer({ content }: NoteRendererProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const editorInstance = new (useEditor as any).__proto__({
      extensions: [StarterKit],
      content: content,
      editable: false,
    });
    setEditor(editorInstance);

    return () => {
      editorInstance.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
