
"use client";

import { Note } from "@/lib/types";
import { NotesEditor } from "@/components/projects/notes-editor";

interface NotesTabContentProps {
  initialNotes: Note[];
  onNotesChange: (notes: Note[]) => void;
}

export function NotesTabContent({ initialNotes, onNotesChange }: NotesTabContentProps) {
  return (
    <NotesEditor initialNotes={initialNotes} onNotesChange={onNotesChange} />
  );
}
