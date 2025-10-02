"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import type { ProjectCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  categories: ProjectCategory[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
  showBadges?: boolean;
}

const DEFAULT_PLACEHOLDER = "Filter by categories";

export function CategoryMultiSelect({
  categories,
  selectedIds,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
  emptyLabel = "All categories",
  showBadges = true,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCategories = useMemo(
    () =>
      selectedIds
        .map((id) => categories.find((cat) => cat.id === id))
        .filter((cat): cat is ProjectCategory => Boolean(cat)),
    [categories, selectedIds],
  );

  const displayLabel = useMemo(() => {
    if (selectedCategories.length === 0) return placeholder;
    if (selectedCategories.length === 1) return selectedCategories[0].name;
    if (selectedCategories.length === 2)
      return `${selectedCategories[0].name}, ${selectedCategories[1].name}`;
    return `${selectedCategories.length} categories`;
  }, [placeholder, selectedCategories]);

  const toggleCategory = (categoryId: string, checked: boolean) => {
    const hasId = selectedIds.includes(categoryId);
    if (checked && !hasId) {
      onChange([...selectedIds, categoryId]);
    } else if (!checked && hasId) {
      onChange(selectedIds.filter((id) => id !== categoryId));
    }
  };

  const clearSelection = () => {
    if (selectedIds.length > 0) {
      onChange([]);
    }
  };

  return (
    <div
      className={cn(
        showBadges ? "flex flex-col gap-2" : "flex flex-col",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            <span className="truncate pr-2">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Categories
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
            >
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-52 overflow-auto pr-1">
            {categories.map((category) => {
              const checked = selectedIds.includes(category.id);

              const handleToggle = (nextChecked: boolean) => {
                toggleCategory(category.id, nextChecked);
              };

              const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  handleToggle(!checked);
                }
              };

              return (
                <div
                  key={category.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handleToggle(!checked)}
                  onKeyDown={handleKeyDown}
                  aria-pressed={checked}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      handleToggle(value === true)
                    }
                    onClick={(event) => event.stopPropagation()}
                    className="h-4 w-4"
                    aria-label={`Toggle ${category.name}`}
                  />
                  <span className="flex-1 truncate">{category.name}</span>
                  {category.color && (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No categories defined.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showBadges && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.length === 0 ? (
            <Badge variant="secondary" className="text-xs">
              {emptyLabel}
            </Badge>
          ) : (
            selectedCategories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                style={{
                  borderColor: category.color,
                  color: category.color,
                }}
                className="text-xs"
              >
                {category.name}
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}
