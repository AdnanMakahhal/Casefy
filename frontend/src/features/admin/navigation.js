import {
  BarChart3,
  CreditCard,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Receipt,
  RotateCcw,
  Sparkles,
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
  integrations: {
    title: "API integrations",
    description: "Connect AI generation, email delivery, and billing.",
    icon: Plug,
    section: "Tools",
  },
  generator: {
    title: "Test generator",
    description: "Generate test cases with unlimited staff access.",
    icon: Sparkles,
  },
  reports: {
    title: "Reports",
    description: "Generation history and results across your workspace.",
    icon: BarChart3,
  },
};

export function adminNavigation(pathname, search) {
  const view =
    pathname === "/test-generator"
      ? "generator"
      : pathname === "/reports"
        ? "reports"
        : new URLSearchParams(search).get("view") || "overview";
  return Object.entries(adminViews).map(([key, item]) => ({
    label: item.title,
    icon: item.icon,
    section: item.section,
    to: key === "overview" ? "/admin" : `/admin?view=${key}`,
    selected: view === key,
  }));
}
