"use client";

import { useState, useEffect, useContext } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/lib/types";
import { DataContext } from "@/context/data-context";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  priority: z.coerce.number().min(0).optional(),
  // support multiple categories per project
  categoryIds: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface EditProjectDialogProps {
  project: Project;
  onUpdateProject: (data: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

export function EditProjectDialog({
  project,
  onUpdateProject,
  onDeleteProject,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const { categories } = useContext(DataContext);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description,
      priority: project.priority,
      // default to existing categoryIds if present, otherwise fall back to legacy categoryId
      categoryIds:
        project.categoryIds && project.categoryIds.length > 0
          ? project.categoryIds
          : [project.categoryId || "cat-default"],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: project.name,
        description: project.description,
        priority: project.priority,
        categoryIds:
          project.categoryIds && project.categoryIds.length > 0
            ? project.categoryIds
            : [project.categoryId || "cat-default"],
      });
    }
  }, [open, project, form]);

  const onSubmit = (data: ProjectFormValues) => {
    onUpdateProject(data);
    toast({
      title: "Project Updated",
      description: `Project "${data.name}" has been updated successfully.`,
    });
    setOpen(false);
  };

  const handleDelete = () => {
    onDeleteProject(project.id);
    setDeleteAlertOpen(false);
    setOpen(false);
    toast({
      title: "Project Deleted",
      description: `Project "${project.name}" has been deleted.`,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to your project details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Website Redesign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. A brief description of what this project is about."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2 p-1 border rounded max-h-40 overflow-auto">
                          {categories.map((cat) => {
                            const selected: string[] = Array.isArray(
                              field.value,
                            )
                              ? field.value
                              : [];
                            const checked = selected.includes(cat.id);
                            return (
                              <label
                                key={cat.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={checked}
                                  onChange={(e) => {
                                    const prev: string[] = Array.isArray(
                                      field.value,
                                    )
                                      ? [...field.value]
                                      : [];
                                    let next: string[];
                                    if (e.target.checked) {
                                      if (!prev.includes(cat.id))
                                        next = [...prev, cat.id];
                                      else next = prev;
                                    } else {
                                      next = prev.filter((v) => v !== cat.id);
                                    }
                                    field.onChange(next);
                                  }}
                                />
                                <span className="text-sm">{cat.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteAlertOpen(true)}
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all of its associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
