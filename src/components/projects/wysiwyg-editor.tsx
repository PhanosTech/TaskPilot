"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Gapcursor from "@tiptap/extension-gapcursor";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  ListTodo,
  Table as TableIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useCallback } from "react";

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const Toolbar = ({ editor }: { editor: any | null }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt("Enter the image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="border border-b-0 rounded-t-md p-2 flex items-center gap-1 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") ? "bg-accent" : "")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") ? "bg-accent" : "")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={setLink}
        className={cn(editor.isActive("link") ? "bg-accent" : "")}
        title="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={
          !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
        }
        className={cn(
          editor.isActive("heading", { level: 1 }) ? "bg-accent" : "",
        )}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={
          !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
        }
        className={cn(
          editor.isActive("heading", { level: 2 }) ? "bg-accent" : "",
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={
          !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
        }
        className={cn(
          editor.isActive("heading", { level: 3 }) ? "bg-accent" : "",
        )}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") ? "bg-accent" : "")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") ? "bg-accent" : "")}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={cn(editor.isActive("taskList") ? "bg-accent" : "")}
        title="Task List"
      >
        <ListTodo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") ? "bg-accent" : "")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(editor.isActive("codeBlock") ? "bg-accent" : "")}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addImage} title="Image">
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert Table"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      {editor.isActive("table") && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            Add Col Before
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            Add Col After
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            Delete Col
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            Add Row Before
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            Add Row After
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            Delete Row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete Table
          </Button>
        </>
      )}
    </div>
  );
};

export function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ImageExtension.extend({
        addAttributes() {
          return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
            width: {
              default: null,
              // read width attribute from HTML when loading content
              parseHTML: (element: any) =>
                element.getAttribute("width") || null,
              // render the width attribute back into HTML so it persists
              renderHTML: (attributes: any) => {
                return attributes.width ? { width: attributes.width } : {};
              },
            },
            height: {
              default: null,
              parseHTML: (element: any) =>
                element.getAttribute("height") || null,
              renderHTML: (attributes: any) => {
                return attributes.height ? { height: attributes.height } : {};
              },
            },
            style: {
              default: null,
              // keep any inline style attribute when parsing HTML
              parseHTML: (element: any) =>
                element.getAttribute("style") || null,
              // render the style attribute back into HTML so the inline sizing persists
              renderHTML: (attributes: any) => {
                return attributes.style ? { style: attributes.style } : {};
              },
            },
          };
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Gapcursor,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none w-full h-full focus:outline-none p-2",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // Paste handler: accept image clipboard items, convert to base64 and insert as image node.
  // This allows pasting screenshots or copied images directly into the editor.
  useEffect(() => {
    if (!editor) return;

    const el = editor.view.dom as HTMLElement;

    const handlePaste = (e: ClipboardEvent) => {
      try {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        const items = Array.from(clipboardData.items || []);
        for (const item of items) {
          if (item.type && item.type.startsWith("image/")) {
            // Prevent default paste for image items
            e.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;

            // Resize image before inserting
            const resizeAndInsert = (file: File) => {
              const img = new Image();
              const url = URL.createObjectURL(file);
              img.onload = () => {
                try {
                  const MAX_DIM = 700; // max width or height in px
                  let { width, height } = img;
                  let targetWidth = width;
                  let targetHeight = height;
                  if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                      targetWidth = MAX_DIM;
                      targetHeight = Math.round((height / width) * MAX_DIM);
                    } else {
                      targetHeight = MAX_DIM;
                      targetWidth = Math.round((width / height) * MAX_DIM);
                    }
                  }

                  const canvas = document.createElement("canvas");
                  canvas.width = targetWidth;
                  canvas.height = targetHeight;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    // fallback: insert original file as base64
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result as string | null;
                      if (result) {
                        editor.chain().focus().setImage({ src: result }).run();
                      }
                    };
                    reader.readAsDataURL(file);
                    URL.revokeObjectURL(url);
                    return;
                  }

                  // Draw the resized image
                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                  // Choose output type: use original type if supported, else jpeg
                  const outType = file.type || "image/jpeg";
                  const quality = outType === "image/png" ? 1.0 : 0.9;
                  const dataUrl = canvas.toDataURL(outType, quality);

                  // Insert as an <img> element with an inline style so sizing persists in the HTML.
                  // Use targetWidth (calculated above) to set a reasonable display width while
                  // preserving aspect ratio with height:auto.
                  editor.chain().focus().setImage({ src: dataUrl }).run();
                  // Persist inline sizing via image attributes so serialized HTML retains sizing.
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", {
                      style: `max-width:100%; width:${targetWidth}px; height:auto;`,
                    })
                    .run();
                } catch (err) {
                  // fallback to inserting as-is on any error
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string | null;
                    if (result) {
                      editor.chain().focus().setImage({ src: result }).run();
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("image", {
                          style: "max-width:100%; height:auto;",
                        })
                        .run();
                    }
                  };
                  reader.readAsDataURL(file);
                } finally {
                  URL.revokeObjectURL(url);
                }
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                // fallback: read file directly
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string | null;
                  if (result) {
                    editor.chain().focus().setImage({ src: result }).run();
                  }
                };
                reader.readAsDataURL(file);
              };
              img.src = url;
            };

            resizeAndInsert(file);

            // Stop after first image handled
            break;
          }
        }
      } catch (err) {
        // swallow errors to avoid breaking paste for other content
        // (e.g., non-image clipboard content)
        // eslint-disable-next-line no-console
        console.error("Paste image handling failed:", err);
      }
    };

    // Drop handler: allow dropping image files and resize/upload them same as paste
    const handleDrop = (ev: DragEvent) => {
      try {
        const dt = ev.dataTransfer;
        if (!dt) return;
        const files = Array.from(dt.files || []);
        for (const file of files) {
          if (file.type && file.type.startsWith("image/")) {
            ev.preventDefault();
            // reuse the same resize/insert logic used for paste
            const pasteLikeFile = file;
            // call same resizing logic
            const img = new Image();
            const url = URL.createObjectURL(pasteLikeFile);
            img.onload = () => {
              try {
                const MAX_DIM = 700;
                let { width, height } = img;
                let targetWidth = width;
                let targetHeight = height;
                if (width > MAX_DIM || height > MAX_DIM) {
                  if (width > height) {
                    targetWidth = MAX_DIM;
                    targetHeight = Math.round((height / width) * MAX_DIM);
                  } else {
                    targetHeight = MAX_DIM;
                    targetWidth = Math.round((width / height) * MAX_DIM);
                  }
                }
                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string | null;
                    if (result) {
                      editor.chain().focus().setImage({ src: result }).run();
                    }
                  };
                  reader.readAsDataURL(pasteLikeFile);
                  URL.revokeObjectURL(url);
                  return;
                }
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                const outType = pasteLikeFile.type || "image/jpeg";
                const quality = outType === "image/png" ? 1.0 : 0.9;
                const dataUrl = canvas.toDataURL(outType, quality);
                editor.chain().focus().setImage({ src: dataUrl }).run();
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", {
                    style: `max-width:100%; width:${targetWidth}px; height:auto;`,
                  })
                  .run();
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", {
                    style: `max-width:100%; width:${targetWidth}px; height:auto;`,
                  })
                  .run();
              } catch (err) {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string | null;
                  if (result) {
                    // Insert as HTML with inline style so the sizing persists in the editor content.
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        `<img src="${result}" style="max-width:100%; height:auto;" />`,
                      )
                      .run();
                  }
                };
                reader.readAsDataURL(pasteLikeFile);
              } finally {
                URL.revokeObjectURL(url);
              }
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string | null;
                if (result) {
                  editor.chain().focus().setImage({ src: result }).run();
                }
              };
              reader.readAsDataURL(pasteLikeFile);
            };
            img.src = url;
            break;
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Drop image handling failed:", err);
      }
    };

    // Click handler: allow clicking an existing link to edit or remove it.
    // When a user clicks on an <a> element inside the editor we:
    // 1) set a selection that covers the link text,
    // 2) prompt for a new URL (pre-filled with the previous one),
    // 3) update or unset the link mark.
    const handleClick = (ev: MouseEvent) => {
      try {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        // IMAGE CLICK: allow resizing images via a simple prompt (px or %).
        const clickedImg = (target.closest &&
          target.closest("img")) as HTMLImageElement | null;
        if (clickedImg) {
          ev.preventDefault();

          const imgSrc = clickedImg.getAttribute("src") || clickedImg.src || "";
          if (!imgSrc) return;

          // Ask user for desired width (px number or percentage). Empty to clear sizing.
          const currentWidth =
            clickedImg.getAttribute("width") ||
            (clickedImg.width ? String(clickedImg.width) : "");
          const input = window.prompt(
            "Set image width (e.g. 700 or 50%). Leave blank to reset.",
            currentWidth,
          );
          if (input === null) return; // cancelled

          let widthVal: string | undefined;
          if (input.trim() === "") {
            widthVal = undefined;
          } else {
            const v = input.trim();
            if (v.endsWith("%")) {
              widthVal = v;
            } else {
              const n = parseInt(v, 10);
              widthVal = !Number.isNaN(n) && n > 0 ? `${n}px` : undefined;
            }
          }

          // Find the image node position in the ProseMirror document by matching the src.
          let imgPos: number | null = null;
          editor.state.doc.descendants((node, pos) => {
            if (
              node.type.name === "image" &&
              node.attrs &&
              node.attrs.src === imgSrc
            ) {
              imgPos = pos;
              return false; // stop iteration
            }
            return true;
          });

          // Fallback to DOM->pos mapping if not found by src
          if (imgPos === null) {
            const view = editor.view;
            if (!view) return;
            const p = view.posAtDOM(clickedImg, 0);
            if (typeof p !== "number") return;
            imgPos = p;
          }

          // Apply the change: select the image node and update attributes so sizing persists.
          if (typeof imgPos === "number") {
            editor.chain().focus().setNodeSelection(imgPos).run();
            if (widthVal !== undefined) {
              editor
                .chain()
                .focus()
                .updateAttributes("image", {
                  style: `width: ${widthVal}; height: auto;`,
                })
                .run();
            } else {
              editor
                .chain()
                .focus()
                .updateAttributes("image", { style: null })
                .run();
            }
          }

          return;
        }

        // LINK CLICK: allow editing existing links (select link text then prompt)
        const anchor = (target.closest &&
          target.closest("a")) as HTMLElement | null;
        if (!anchor) return;

        ev.preventDefault();
        const view = editor.view;
        if (!view) return;

        const startPos = view.posAtDOM(anchor, 0);
        const textLength = anchor.textContent ? anchor.textContent.length : 0;
        if (typeof startPos !== "number" || textLength === 0) return;

        const from = startPos + 1;
        const to = from + textLength;
        editor.chain().focus().setTextSelection({ from, to }).run();

        const previousUrl = editor.getAttributes("link").href || "";
        const url = window.prompt("URL", previousUrl);
        if (url === null) return;

        if (url === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }
      } catch (err) {
        // Do not break the editor on unexpected errors
        // eslint-disable-next-line no-console
        console.error("Editor click handler failed:", err);
      }
    };

    el.addEventListener("paste", handlePaste as EventListener);
    el.addEventListener("drop", handleDrop as EventListener);
    el.addEventListener("click", handleClick as EventListener);

    return () => {
      el.removeEventListener("paste", handlePaste as EventListener);
      el.removeEventListener("drop", handleDrop as EventListener);
      el.removeEventListener("click", handleClick as EventListener);
    };
  }, [editor]);

  return (
    <div className="w-full h-full border rounded-md flex flex-col">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto min-w-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
