
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Note, Block } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, MoreVertical, ChevronRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";


interface NotesEditorProps {
  initialNotes: Note[];
  onNotesChange: (notes: Note[]) => void;
}

const safeJSONParse = (content: string): Block[] | undefined => {
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

export function NotesEditor({ initialNotes, onNotesChange }: NotesEditorProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNotes.find(n => !n.parentId)?.id || null);
  
  const editor = useCreateBlockNote();
  
  // This effect runs ONLY when the user selects a different note.
  // It loads the new note's content into the editor.
  useEffect(() => {
    const noteToLoad = notes.find(note => note.id === activeNoteId);
    if (noteToLoad) {
      const content = safeJSONParse(noteToLoad.content);
      // We use `replaceBlocks` to programmatically update the editor's content.
      editor.replaceBlocks(editor.document, content || []);
    } else {
      // If no note is selected, clear the editor.
      editor.replaceBlocks(editor.document, []);
    }
  // Disabling exhaustive-deps is necessary here to prevent a feedback loop.
  // We only want this effect to fire when the user clicks a new note (activeNoteId changes).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNoteId, editor]);

  const handleAddNote = (parentId?: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "New Note",
      content: "",
      parentId,
    };
    const newNotes = [...notes, newNote];
    setNotes(newNotes);
    setActiveNoteId(newNote.id);
    onNotesChange(newNotes);
  };

  const handleDeleteNote = (noteId: string) => {
    const notesToDelete = new Set<string>([noteId]);
    let changed = true;
    while (changed) {
      changed = false;
      notes.forEach(note => {
        if (note.parentId && notesToDelete.has(note.parentId) && !notesToDelete.has(note.id)) {
          notesToDelete.add(note.id);
          changed = true;
        }
      });
    }

    const newNotes = notes.filter((note) => !notesToDelete.has(note.id));
    setNotes(newNotes);

    if (activeNoteId && notesToDelete.has(activeNoteId)) {
      setActiveNoteId(newNotes.find(n => !n.parentId)?.id || newNotes[0]?.id || null);
    }
    onNotesChange(newNotes);
  };
  
  const handleMoveNote = (noteId: string, targetParentId?: string) => {
    const newNotes = notes.map(n => n.id === noteId ? { ...n, parentId: targetParentId } : n);
    setNotes(newNotes);
    onNotesChange(newNotes);
  };

  const handleToggleCollapse = (noteId: string) => {
    const newNotes = notes.map(n => n.id === noteId ? { ...n, isCollapsed: !n.isCollapsed } : n);
    setNotes(newNotes);
    onNotesChange(newNotes);
  };
  
  const handleNoteTitleChange = (title: string) => {
    if (activeNoteId) {
      const newNotes = notes.map((note) =>
        note.id === activeNoteId ? { ...note, title } : note
      );
      setNotes(newNotes);
      onNotesChange(newNotes);
    }
  };

  const activeNote = useMemo(() => notes.find((note) => note.id === activeNoteId), [notes, activeNoteId]);

  const renderNoteTree = (parentId?: string, level = 0): JSX.Element[] => {
    return notes
      .filter(note => note.parentId === parentId)
      .map(note => {
        const children = notes.filter(child => child.parentId === note.id);
        const isCollapsed = note.isCollapsed;

        return (
          <div key={note.id} style={{ paddingLeft: `${level * 16}px` }}>
            <div className="relative group flex items-center pr-1">
              {children.length > 0 ? (
                <Button variant="ghost" size="icon" onClick={() => handleToggleCollapse(note.id)} className="h-6 w-6 shrink-0">
                  <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")} />
                </Button>
              ) : (
                <div className="h-6 w-6 shrink-0" /> /* Placeholder for alignment */
              )}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left truncate h-8 px-2",
                  note.id === activeNoteId && "bg-accent text-accent-foreground"
                )}
                onClick={() => setActiveNoteId(note.id)}
              >
                {note.title}
              </Button>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                     <DropdownMenuItem onSelect={() => handleAddNote(note.id)}>
                        <CornerDownRight className="h-4 w-4 mr-2"/> Add Sub-note
                    </DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4 mr-2"/> Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {note.parentId && (
                      <DropdownMenuItem onSelect={() => handleMoveNote(note.id, undefined)}>
                        Move to Top Level
                      </DropdownMenuItem>
                    )}
                    {notes.filter(n => n.id !== note.id && n.parentId !== note.id && n.id !== note.parentId).map(parent => (
                      <DropdownMenuItem key={parent.id} onSelect={() => handleMoveNote(note.id, parent.id)}>
                        Move to "{parent.title}"
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {!isCollapsed && children.length > 0 && renderNoteTree(note.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[700px] mt-4">
      <div className="col-span-1 border rounded-lg p-2 flex flex-col">
        <Button onClick={() => handleAddNote()} className="mb-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Note
        </Button>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 pr-2">
            {renderNoteTree()}
          </div>
        </ScrollArea>
      </div>
      <div className="col-span-3 border rounded-lg p-4 flex flex-col gap-4">
        {activeNote ? (
          <>
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteTitleChange(e.target.value)}
              className="text-lg font-bold"
            />
            <div className="flex-1 h-full overflow-y-auto">
                 <BlockNoteView 
                    editor={editor} 
                    theme={"light"}
                    onChange={() => {
                        const newNotes = notes.map(note => 
                            note.id === activeNoteId 
                                ? { ...note, content: JSON.stringify(editor.document) } 
                                : note
                        );
                        setNotes(newNotes);
                        onNotesChange(newNotes);
                    }}
                />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a note or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
