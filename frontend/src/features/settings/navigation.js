import {
  RiBuildingLine as Building,
  RiSettings3Line as Settings,
  RiUserLine as User,
} from "react-icons/ri";

export const settingsNavigation = [
  {
    label: "Settings",
    description: "Manage usage, subscriptions, and billing.",
    icon: Settings,
    to: "/settings",
  },
];

export const settingsPageLinks = [
  {
    label: "Profile",
    description: "Update your personal details, email, and profile photo.",
    icon: User,
    to: "/settings/profile",
  },
  {
    label: "Workspace settings",
    description: "Create, review, and manage your workspaces.",
    icon: Building,
    to: "/settings/workspaces",
  },
];
