import {
  CreditCard,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  RotateCcw,
  Users,
} from "lucide-react";

export const adminViews = {
  overview: {
    title: "Admin dashboard",
    description: "Your users, projects, and account activity at a glance.",
    icon: LayoutDashboard,
    section: "Workspace",
  },
  users: {
    title: "Manage users",
    description: "Manage users, access, roles, and account plans.",
    icon: Users,
    section: "Management",
  },
  support: {
    title: "Support messages",
    description: "Contact requests and support conversations in one inbox.",
    icon: MessageSquare,
  },
  enterprise: {
    title: "Enterprise contacts",
    description: "Manage Enterprise enquiries and team requirements.",
    icon: Handshake,
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Review account plans, renewal dates, and cancellations.",
    icon: CreditCard,
    section: "Billing",
  },
  payments: {
    title: "Payments",
    description: "Review Stripe payments and issue full or partial refunds.",
    icon: Receipt,
  },
  refunds: {
    title: "Refunds",
    description: "Track refund requests and issued refunds.",
    icon: RotateCcw,
  },
};

export function adminNavigation(pathname, search) {
  const view =
    pathname === "/admin"
      ? new URLSearchParams(search).get("view") || "overview"
      : null;
  return Object.entries(adminViews).map(([key, item]) => ({
    label: item.title,
    icon: item.icon,
    section: item.section,
    to: key === "overview" ? "/admin" : `/admin?view=${key}`,
    selected: view === key,
  }));
}
