
"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useContext } from "react";
import { PlusCircle, Calendar as CalendarIcon, X } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, Subtask, TaskStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DataContext } from "@/context/data-context";

const taskSchema = z.object({
  title: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  deadline: z.date().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  storyPoints: z.coerce.number().min(1, "Story points must be at least 1").max(10, "Story points cannot be more than 10"),
  subtasks: z.array(z.object({
    title: z.string().min(1, "Subtask title cannot be empty"),
    storyPoints: z.coerce.number().min(0),
  })).optional(),
  projectId: z.string().min(1, "A project is required."),
  status: z.enum(["To Do", "In Progress", "Done"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  onTaskCreated: (data: Omit<Task, 'id' | 'logs'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  defaultStatus?: TaskStatus;
  defaultProjectId?: string;
}

export function CreateTaskDialog({ 
  onTaskCreated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
  defaultStatus = "To Do",
  defaultProjectId,
 }: CreateTaskDialogProps) {
  const { projects } = useContext(DataContext);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskPoints, setNewSubtaskPoints] = useState(0);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      storyPoints: 2,
      subtasks: [],
      status: defaultStatus,
      projectId: defaultProjectId,
      deadline: addDays(new Date(), 4),
    },
  });

  useEffect(() => {
    form.reset({
      title: "",
      description: "",
      priority: "Medium",
      storyPoints: 2,
      subtasks: [],
      deadline: addDays(new Date(), 4),
      status: defaultStatus,
      projectId: defaultProjectId,
    });
  }, [open, defaultStatus, defaultProjectId, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      append({ title: newSubtaskTitle.trim(), storyPoints: newSubtaskPoints });
      setNewSubtaskTitle("");
      setNewSubtaskPoints(0);
    }
  };


  const onSubmit = (data: TaskFormValues) => {
    const finalSubtasks: Subtask[] = (data.subtasks || []).map((st, index) => ({
      id: `sub-${Date.now()}-${index}`,
      title: st.title,
      storyPoints: st.storyPoints,
      isCompleted: false,
    }));

    onTaskCreated({ 
      ...data,
      deadline: data.deadline?.toISOString(),
      subtasks: finalSubtasks,
    });

    toast({
      title: "Task Created",
      description: `Task "${data.title}" has been created successfully.`,
    });
    setOpen(false);
    form.reset();
  };

  const trigger = children ? (
    <DialogTrigger asChild>{children}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button>
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Design new logo" {...field} />
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
                      placeholder="e.g. A brief description of the task."
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
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MM/dd/yy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" placeholder="e.g. 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Subtasks</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input {...form.register(`subtasks.${index}.title`)} className="flex-1" placeholder="Subtask title" />
                    <Input {...form.register(`subtasks.${index}.storyPoints`)} type="number" className="w-20" placeholder="Pts" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  placeholder="Add a new subtask title" 
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                />
                 <Input 
                  type="number"
                  placeholder="Pts" 
                  className="w-20"
                  value={newSubtaskPoints}
                  onChange={(e) => setNewSubtaskPoints(Number(e.target.value))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                />
                <Button type="button" onClick={handleAddSubtask}>Add</Button>
              </div>
            </div>

             <DialogFooter>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
