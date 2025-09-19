
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="prose dark:prose-invert max-w-none w-full h-full border rounded-md p-2">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
