
import type { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { DataProvider } from '@/context/data-context';
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "TaskPilot",
  description: "A modern, offline-first project management application.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
