
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
    const [editor, setEditor] = useState<Editor | null>(null);

    useEffect(() => {
      const editorInstance = new (useEditor as any). __proto__({
        extensions: [StarterKit],
        content: content,
        onUpdate: ({ editor }) => {
          onChange(editor.getHTML());
        },
      });
      setEditor(editorInstance);
  
      return () => {
        editorInstance.destroy();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
