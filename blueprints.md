# TaskPilot: Application Blueprint

## 1. Overview

TaskPilot is a modern, offline-first project management application designed to help individuals and small teams manage their work efficiently. It provides a clean, intuitive interface for creating projects, tracking tasks and subtasks, and visualizing progress. The application is built as a single-page application (SPA) with a focus on usability, performance, and a calm, focused user experience.

---

## 2. Core Features & Requirements

### Functional Requirements:

-   **Project Management**:
    -   Users can create, view, and manage multiple projects.
    -   Each project has a name and a description.

-   **Task Management**:
    -   Users can create tasks within a project.
    -   Each task includes a title, description, status, priority, and deadline.
    -   Tasks can be assigned to different statuses: "To Do", "In Progress", and "Done".
    -   Tasks can have priorities: "Low", "Medium", "High".

-   **Subtask Management**:
    -   Tasks can be broken down into smaller, actionable subtasks.
    -   Each subtask can be marked as complete or incomplete, and progress is tracked visually.

-   **Kanban Board**:
    -   A visual, drag-and-drop Kanban board to manage task status across columns ("To Do", "In Progress", "Done").
    -   Provides a clear overview of the current state of all tasks.

-   **Progress Tracking & Reporting**:
    -   The dashboard provides at-a-glance statistics: total projects, tasks in progress, and overdue tasks.
    -   Each project page includes charts to visualize task status distribution.
    -   A dedicated reports page allows users to filter and view work logs by project and date range.

-   **Project Notes**:
    -   Each project can have multiple rich-text notes for documentation, meeting minutes, or specifications.
    -   Notes support Markdown formatting with a live preview.
    -   A simple toolbar is provided for common formatting actions (headings, bold, italics, checklists).
    -   Tasks can be embedded directly into notes to show their current status.

### Non-Functional Requirements:

-   **Responsiveness**: The application must be fully responsive and functional across desktop, tablet, and mobile devices.
-   **Performance**: The interface should be fast and responsive, with minimal loading times.
-   **Usability**: The design must be intuitive and easy to navigate, requiring minimal onboarding for new users.

---

## 3. Design & Style Guidelines

The visual design of TaskPilot aims to be clean, modern, and calming to promote focus.

-   **Color Palette**:
    -   **Primary**: Soft sky blue (`#87CEEB`) - Used for primary actions, links, and active indicators. Conveys trust and clarity.
    -   **Background**: Very light desaturated blue (`#F0F8FF`) - Provides a calm, unobtrusive backdrop for the content.
    -   **Accent**: Muted orange (`#E07A5F`) - Used for highlighting important actions, notifications, and statuses (like overdue tasks).

-   **Typography**:
    -   **Font**: 'Inter' (sans-serif) for all body and headline text to maintain a neat, precise, and modern aesthetic.

-   **Layout & Components**:
    -   **Layout**: A clean, card-based layout is used for projects and tasks to promote clarity and organization.
    -   **Icons**: Flat, outline-style icons from the `lucide-react` library are used to maintain a clean and modern look.
    -   **Interactivity**: Subtle animations and transitions provide feedback on user interactions (e.g., button clicks, task status changes).
    -   **Styling**: UI components are built using ShadCN UI and styled with Tailwind CSS, ensuring a consistent and professional feel with rounded corners and soft shadows.

---

## 4. Technical Architecture & Stack

TaskPilot is built on a modern, robust tech stack chosen for its performance, developer experience, and scalability.

-   **Framework**: **Next.js (App Router)** - Leverages React Server Components for improved performance and a modern development paradigm.
-   **Language**: **TypeScript** - Ensures type safety and improves code quality and maintainability.
-   **Styling**: **Tailwind CSS** - A utility-first CSS framework for rapid and consistent UI development.
-   **UI Components**: **ShadCN UI** - A collection of beautifully designed, accessible, and composable components.
-   **State Management**: **React Hooks (`useState`, `useEffect`)** - Local component state is managed using native React hooks to keep the architecture simple and predictable.
-   **Generative AI**: **Genkit** - Used for any potential AI-powered features, configured with Google's Gemini models.

---

## 5. Component Breakdown

The application is structured into a series of reusable React components.

-   **/components/layout**: Contains global layout components like `AppHeader` and `AppSidebar`.
-   **/components/projects**: Components related to project management, such as `CreateProjectDialog`, `NotesEditor`, and `NoteRenderer`.
-   **/components/tasks**: Components for task management, including `CreateTaskDialog` and `TaskDetailDialog`.
-   **/components/board**: Components for the Kanban view, such as `KanbanBoard`, `KanbanColumn`, and `KanbanCard`.
-   **/components/charts**: Reusable chart components (`TasksByStatusChart`, etc.) built with `recharts`.
-   **/components/ui**: Core UI elements from ShadCN (`Button`, `Card`, `Dialog`, `Input`, etc.).

---

## 6. Data Model

The application's data is structured around a few core types.

-   **Project**:
    -   `id`: `string`
    -   `name`: `string`
    -   `description`: `string`
    -   `notes`: `Note[]`

-   **Task**:
    -   `id`: `string`
    -   `projectId`: `string`
    -   `title`: `string`
    -   `description`: `string`
    -   `status`: `'To Do' | 'In Progress' | 'Done'`
    -   `priority`: `'Low' | 'Medium' | 'High'`
    -   `deadline`: `string` (ISO 8601 format)
    -   `subtasks`: `Subtask[]`
    -   `logs`: `Log[]`

-   **Subtask**:
    -   `id`: `string`
    -   `title`: `string`
    -   `isCompleted`: `boolean`

-   **Note**:
    -   `id`: `string`
    -   `title`: `string`
    -   `content`: `string` (Markdown)

-   **Log**:
    -   `id`: `string`
    -   `content`: `string`
    -   `createdAt`: `string` (ISO 8601 format)
