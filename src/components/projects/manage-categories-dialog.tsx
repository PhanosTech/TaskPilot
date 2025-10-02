
"use client";

import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataContext } from "@/context/data-context";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectCategory } from "@/lib/types";

export function ManageCategoriesDialog() {
  const { categories, createCategory, updateCategory, deleteCategory, moveCategory } = useContext(DataContext);
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#808080");
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    createCategory({ name: newCategoryName, color: newCategoryColor });
    setNewCategoryName("");
    setNewCategoryColor("#808080");
  };

  const handleUpdateCategory = (id: string, data: Partial<ProjectCategory>) => {
    updateCategory(id, data);
  };
  
  const handleDeleteCategory = (id: string) => {
    if (id === 'cat-default') {
        toast({ title: "Error", description: "The default category cannot be deleted.", variant: "destructive" });
        return;
    }
    deleteCategory(id);
    toast({ title: "Category Deleted", description: "The category has been deleted." });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Categories</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Project Categories</DialogTitle>
          <DialogDescription>
            Add, edit, delete, or reorder your project categories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Existing Categories</Label>
            <div className="space-y-2 rounded-md border p-2">
              {categories.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={cat.color}
                    onChange={(e) => handleUpdateCategory(cat.id, { color: e.target.value })}
                    className="h-8 w-10 p-1"
                    disabled={cat.id === 'cat-default'}
                  />
                  <Input
                    value={cat.name}
                    onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                    className="h-8"
                    disabled={cat.id === 'cat-default'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveCategory(cat.id, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveCategory(cat.id, "down")}
                    disabled={index === categories.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={cat.id === 'cat-default'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add New Category</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="h-8 w-10 p-1"
              />
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8"
              />
              <Button size="icon" className="h-8 w-8" onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
