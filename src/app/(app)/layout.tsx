
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { DataProvider } from '@/context/data-context';
import { TodoProvider } from '@/context/todo-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <TodoProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AppSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 max-w-full overflow-x-hidden">
            <AppHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
      </TodoProvider>
    </DataProvider>
  );
}
