import type { Project, Task, ProjectCategory } from "@/lib/types";

export const categories: ProjectCategory[] = [
  { id: "cat-default", name: "Work", color: "#808080" },
  { id: "cat-1", name: "Website", color: "#4A90E2" },
  { id: "cat-2", name: "Mobile App", color: "#50E3C2" },
];

export const projects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description:
      "Complete redesign of the main company website to improve user experience and refresh the branding.",
    status: "In Progress",
    priority: 1,
    categoryId: "cat-1",
    notes: [
      {
        id: "note-1-1",
        title: "Meeting Notes 2024-07-29",
        parentId: null,
        content:
          "### Key Takeaways:\n\n- Finalize branding guide by EOW.\n- User testing to begin next sprint.\n- Marketing team needs new screenshots.",
      },
      {
        id: "note-1-2",
        title: "Initial Design Spec",
        parentId: null,
        content:
          "#### Colors:\n\n- Primary: #007BFF\n- Secondary: #6C757D\n\n#### Typography:\n\n- Headings: Inter Bold\n- Body: Inter Regular",
      },
    ],
  },
  {
    id: "proj-2",
    name: "Mobile App Launch",
    description:
      "Develop and launch a new mobile application for iOS and Android platforms.",
    status: "In Progress",
    priority: 2,
    categoryId: "cat-2",
    notes: [
      {
        id: "note-2-1",
        title: "Test Plan",
        parentId: null,
        content:
          "1.  Unit Tests\n2.  Integration Tests\n3.  End-to-end testing with Cypress\n4.  Manual QA on target devices.",
      },
    ],
  },
  {
    id: "proj-3",
    name: "Q3 Marketing Campaign",
    description:
      "Plan and execute the marketing campaign for the third quarter, focusing on new customer acquisition.",
    status: "Backlog",
    priority: 3,
    categoryId: "cat-default",
    notes: [],
  },
  {
    id: "proj-4",
    name: "Internal Wiki Setup",
    description:
      "Setup a new internal documentation wiki for the engineering team.",
    status: "Done",
    priority: 4,
    categoryId: "cat-default",
    notes: [],
  },
];

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

export const tasks: Task[] = [
  // Project 1 Tasks
  {
    id: "task-1",
    projectId: "proj-1",
    title: "Design new homepage mockups",
    description:
      "Create high-fidelity mockups in Figma for the new homepage layout.",
    status: "In Progress",
    priority: "High",
    deadline: tomorrow.toISOString(),
    storyPoints: 8,
    subtasks: [
      {
        id: "sub-1-1",
        title: "Wireframing",
        isCompleted: true,
        storyPoints: 3,
      },
      {
        id: "sub-1-2",
        title: "Visual design",
        isCompleted: false,
        storyPoints: 5,
      },
      {
        id: "sub-1-3",
        title: "Prototyping",
        isCompleted: false,
        storyPoints: 3,
      },
    ],
    logs: [
      {
        id: "log-1",
        content: "Completed the wireframing for the new homepage.",
        createdAt: yesterday.toISOString(),
      },
    ],
  },
  {
    id: "task-2",
    projectId: "proj-1",
    title: "Develop frontend for the homepage",
    description:
      "Implement the new homepage design using React and Tailwind CSS.",
    status: "To Do",
    priority: "High",
    deadline: nextWeek.toISOString(),
    storyPoints: 13,
    subtasks: [],
    logs: [],
  },
  {
    id: "task-3",
    projectId: "proj-1",
    title: "Setup user authentication",
    description:
      "Integrate authentication service for user login and registration.",
    status: "Done",
    priority: "Medium",
    deadline: yesterday.toISOString(),
    storyPoints: 5,
    subtasks: [
      {
        id: "sub-3-1",
        title: "Integrate Firebase Auth",
        isCompleted: true,
        storyPoints: 3,
      },
      {
        id: "sub-3-2",
        title: "Create login page",
        isCompleted: true,
        storyPoints: 2,
      },
    ],
    logs: [],
  },
  // Project 2 Tasks
  {
    id: "task-4",
    projectId: "proj-2",
    title: "Plan app architecture",
    description: "Define the overall architecture for the mobile application.",
    status: "Done",
    priority: "High",
    deadline: yesterday.toISOString(),
    storyPoints: 8,
    subtasks: [
      {
        id: "sub-4-1",
        title: "Choose tech stack",
        isCompleted: true,
        storyPoints: 3,
      },
      {
        id: "sub-4-2",
        title: "Data modeling",
        isCompleted: true,
        storyPoints: 5,
      },
    ],
    logs: [],
  },
  {
    id: "task-5",
    projectId: "proj-2",
    title: "Develop API endpoints",
    description: "Create necessary API endpoints for the mobile app.",
    status: "In Progress",
    priority: "Medium",
    deadline: nextWeek.toISOString(),
    storyPoints: 13,
    subtasks: [
      {
        id: "sub-5-1",
        title: "User endpoints",
        isCompleted: true,
        storyPoints: 5,
      },
      {
        id: "sub-5-2",
        title: "Task endpoints",
        isCompleted: false,
        storyPoints: 8,
      },
    ],
    logs: [
      {
        id: "log-2",
        content:
          "Finished setting up the user endpoints. Starting on task endpoints tomorrow.",
        createdAt: today.toISOString(),
      },
    ],
  },
  {
    id: "task-6",
    projectId: "proj-2",
    title: "Design UI for login screen",
    description:
      "Create mockups and prototypes for the mobile app login screen.",
    status: "To Do",
    priority: "Low",
    deadline: nextMonth.toISOString(),
    storyPoints: 3,
    subtasks: [],
    logs: [],
  },
  // Project 3 Tasks
  {
    id: "task-7",
    projectId: "proj-3",
    title: "Define campaign goals",
    description:
      "Establish clear objectives and KPIs for the Q3 marketing campaign.",
    status: "To Do",
    priority: "High",
    deadline: yesterday.toISOString(),
    storyPoints: 5,
    subtasks: [
      {
        id: "sub-7-1",
        title: "Finalize KPIs",
        isCompleted: false,
        storyPoints: 5,
      },
    ],
    logs: [],
  },
  {
    id: "task-8",
    projectId: "proj-3",
    title: "Create ad creatives",
    description: "Design visual assets and write copy for digital ads.",
    status: "To Do",
    priority: "Medium",
    deadline: tomorrow.toISOString(),
    storyPoints: 8,
    subtasks: [
      {
        id: "sub-8-1",
        title: "Banner ads",
        isCompleted: false,
        storyPoints: 5,
      },
      {
        id: "sub-8-2",
        title: "Social media posts",
        isCompleted: false,
        storyPoints: 3,
      },
    ],
    logs: [],
  },
];
