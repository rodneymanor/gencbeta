"use client";

import { useAuth } from "@/contexts/auth-context";

import { NavigationSection } from "./expandable-sidebar-panel";

// Sample icons (keeping them consistent with the original)
const sampleIcons = {
  script: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
      <path d="M9 9l1 0"></path>
      <path d="M9 13l6 0"></path>
      <path d="M9 17l6 0"></path>
    </svg>
  ),
  collection: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
      <path d="M12 11v6"></path>
      <path d="M9 14h6"></path>
    </svg>
  ),
  note: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path>
      <path d="M8 7h8"></path>
      <path d="M8 11h8"></path>
      <path d="M8 15h5"></path>
    </svg>
  ),
  star: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"></path>
    </svg>
  ),
  palette: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"></path>
      <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
    </svg>
  ),
};

export function useDynamicSidebarSections(): NavigationSection[] {
  const { user } = useAuth();

  // For now, let's keep the sidebar simple and avoid authentication issues
  // by not fetching any dynamic data. This provides a stable, functional sidebar.

  // We can uncomment these later when authentication is more stable:
  // const { scripts, isLoading: scriptsLoading, error: scriptsError } = useScripts();
  // const [notes, setNotes] = useState<Note[]>([]);

  // For debugging - can be removed later
  console.log("🔍 [Sidebar] User state:", !!user);

  // Return static sections for now to avoid authentication issues
  // This provides a stable, functional sidebar without dynamic data fetching
  return [
    {
      title: "Quick Actions",
      items: [
        {
          id: "add-script",
          title: "Add Script",
          href: "/dashboard/scripts/new",
          icon: sampleIcons.script,
        },
        {
          id: "add-to-collections",
          title: "Add to Collections",
          href: "/research/collections",
          icon: sampleIcons.collection,
        },
        {
          id: "add-note",
          title: "Add Note",
          href: "/dashboard/capture/notes/new",
          icon: sampleIcons.note,
        },
      ],
    },
    {
      title: "Latest Scripts",
      items: [
        {
          id: "all-scripts",
          title: "View All Scripts",
          href: "/dashboard/scripts",
          icon: sampleIcons.star,
        },
      ],
    },
    {
      title: "Latest Notes",
      items: [
        {
          id: "all-notes",
          title: "View All Notes",
          href: "/dashboard/capture/notes",
          icon: sampleIcons.palette,
        },
      ],
    },
  ];
}
