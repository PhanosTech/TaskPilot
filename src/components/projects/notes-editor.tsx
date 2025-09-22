
"use client";

import { useState, useMemo } from "react";
import type { Note } from "@/lib/types";
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
import dynamic from "next/dynamic";

const WysiwygEditor = dynamic(() => import("./wysiwyg-editor").then(mod => mod.WysiwygEditor), { ssr: false });

/**
 * @interface NotesEditorProps
 * Props for the NotesEditor component.
 */
interface NotesEditorProps {
  /** The initial array of notes to display and edit. */
  initialNotes: Note[];
  /** Callback function invoked when the notes are changed. */
  onNotesChange: (notes: Note[]) => void;
}

/**
 * @component NotesEditor
 * A component for managing a hierarchical list of notes. It includes a tree view
 * for note navigation and a WYSIWYG editor for content creation.
 * @param {NotesEditorProps} props - The component props.
 */
export function NotesEditor({ initialNotes, onNotesChange }: NotesEditorProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNotes.find(n => !n.parentId)?.id || null);

  const activeNote = useMemo(() => notes.find((note) => note.id === activeNoteId), [notes, activeNoteId]);

  /**
   * @function handleAddNote
   * Adds a new note to the list, optionally as a child of another note.
   * @param {string} [parentId] - The ID of the parent note.
   */
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

  /**
   * @function handleDeleteNote
   * Deletes a note and all of its descendants from the list.
   * @param {string} noteId - The ID of the note to delete.
   */
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
  
  /**
   * @function handleMoveNote
   * Moves a note to a new parent or to the top level.
   * @param {string} noteId - The ID of the note to move.
   * @param {string} [targetParentId] - The ID of the new parent note. If undefined, moves to the top level.
   */
  const handleMoveNote = (noteId: string, targetParentId?: string) => {
    const newNotes = notes.map(n => n.id === noteId ? { ...n, parentId: targetParentId } : n);
    setNotes(newNotes);
    onNotesChange(newNotes);
  };

  /**
   * @function handleToggleCollapse
   * Toggles the collapsed state of a note with children.
   * @param {string} noteId - The ID of the note to toggle.
   */
  const handleToggleCollapse = (noteId: string) => {
    const newNotes = notes.map(n => n.id === noteId ? { ...n, isCollapsed: !n.isCollapsed } : n);
    setNotes(newNotes);
    onNotesChange(newNotes);
  };
  
  /**
   * @function handleNoteChange
   * Updates the title or content of the currently active note.
   * @param {'title' | 'content'} field - The field to update.
   * @param {string} value - The new value for the field.
   */
  const handleNoteChange = (field: 'title' | 'content', value: string) => {
    if (activeNoteId) {
      const newNotes = notes.map((note) =>
        note.id === activeNoteId ? { ...note, [field]: value } : note
      );
      setNotes(newNotes);
      onNotesChange(newNotes);
    }
  };

  /**
   * @function renderNoteTree
   * Recursively renders the hierarchical tree of notes.
   * @param {string} [parentId] - The ID of the parent note to render children for.
   * @param {number} [level=0] - The current nesting level for indentation.
   * @returns {JSX.Element[]} An array of JSX elements representing the note tree.
   */
  const renderNoteTree = (parentId?: string, level = 0): JSX.Element[] => {
    return notes
      .filter(note => note.parentId === parentId)
      .map(note => {
        const children = notes.filter(child => child.parentId === note.id);
        const isCollapsed = note.isCollapsed;

        return (
          <div key={note.id} style={{ paddingLeft: `${level * 16}px` }}>
            <div className="group flex items-center justify-between pr-1 hover:bg-muted/50 rounded-md">
              <div className="flex items-center flex-1 min-w-0">
                {children.length > 0 ? (
                  <Button variant="ghost" size="icon" onClick={() => handleToggleCollapse(note.id)} className="h-6 w-6 shrink-0">
                    <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")} />
                  </Button>
                ) : (
                  <div className="h-6 w-6 shrink-0" />
                )}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-8 px-2",
                    note.id === activeNoteId && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <span className="truncate">{note.title}</span>
                </Button>
              </div>
              <div className="opacity-0 group-hover:opacity-100 shrink-0">
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
           <div className="flex flex-col gap-1 pr-2 min-w-max">
            {renderNoteTree()}
          </div>
        </ScrollArea>
      </div>
      <div className="col-span-3 border rounded-lg p-4 flex flex-col gap-4">
        {activeNote ? (
          <>
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              className="text-lg font-bold"
            />
            <div className="flex-1 h-full">
              <WysiwygEditor
                key={activeNote.id}
                content={activeNote.content}
                onChange={(content) => handleNoteChange('content', content)}
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
