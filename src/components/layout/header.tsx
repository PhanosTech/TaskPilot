
"use client";

import { useState, useContext, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Menu,
  Home,
  Package2,
  Users,
  BarChart3,
  ListChecks,
  Sun,
  Moon
} from 'lucide-react';
import { DataContext } from '@/context/data-context';
import { useTheme } from "next-themes";

const SearchBar = ({ onResultClick }: { onResultClick?: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { projects, tasks } = useContext(DataContext);
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    
    const lowercasedQuery = searchQuery.toLowerCase();
    
    const filteredProjects = projects
      .filter(p => p.name.toLowerCase().includes(lowercasedQuery))
      .map(p => ({ type: 'Project', ...p }));
      
    const filteredTasks = tasks
      .filter(t => t.title.toLowerCase().includes(lowercasedQuery))
      .map(t => ({ type: 'Task', ...t, name: t.title })); // Add name for consistent rendering
      
    return [...filteredProjects, ...filteredTasks].slice(0, 10);
  }, [searchQuery, projects, tasks]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search projects or tasks..."
        className="w-full appearance-none bg-background pl-8 shadow-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
       {searchQuery && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-background shadow-lg z-10 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map(item => (
              <Link
                key={item.id}
                href={item.type === 'Project' ? `/projects/${item.id}` : `/projects/${item.projectId}`}
                className="block px-4 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  setSearchQuery('');
                  onResultClick?.();
                }}
              >
                <p className="font-medium">{item.type}: {item.name}</p>
                {item.type === 'Task' && (
                  <p className="text-xs text-muted-foreground">in {projects.find(p => p.id === item.projectId)?.name}</p>
                )}
              </Link>
            ))
          ) : (
            <p className="px-4 py-2 text-sm text-muted-foreground">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
};


export function AppHeader() {
  const { setTheme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  
  const navLinks = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/projects", icon: Package2, label: "Projects" },
    { href: "/board", icon: ListChecks, label: "Kanban Board" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ];

  const renderNavLinks = (isMobile = false) => (
    navLinks.map(link => (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => isMobile && setIsSheetOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === link.href ? 'bg-muted text-primary' : ''}`}
      >
        <link.icon className="h-4 w-4" />
        {link.label}
      </Link>
    ))
  );

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
             <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/dashboard"
                  onClick={() => setIsSheetOpen(false)}
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Users className="h-6 w-6" />
                  <span>TaskPilot</span>
                </Link>
                {renderNavLinks(true)}
              </nav>
              <div className="mt-auto">
                <SearchBar onResultClick={() => setIsSheetOpen(false)} />
              </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="w-full flex-1 hidden md:block">
        <SearchBar />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
}
