import type { ReactNode } from 'react';

// This is a new layout file to contain the project-specific context or components
// if needed in the future. For now, it just renders the children.
export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
