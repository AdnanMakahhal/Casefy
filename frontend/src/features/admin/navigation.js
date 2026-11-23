import {
  RiBankCardLine as CreditCard,
  RiDashboardLine as LayoutDashboard,
  RiChat1Line as MessageSquare,
  RiGroupLine as Users,
} from "react-icons/ri";

export const adminViews = {
  overview: {
    title: "Admin dashboard",
    description: "Your users, projects, and account activity at a glance.",
    icon: LayoutDashboard,
  },
  users: {
    title: "Manage users",
    description: "Manage users, access, roles, and account plans.",
    icon: Users,
  },
  support: {
    title: "Support messages",
    description: "Contact requests and support conversations in one inbox.",
    icon: MessageSquare,
  },

  subscriptions: {
    title: "Subscriptions",
    description: "Review account plans, renewal dates, and cancellations.",
    icon: CreditCard,
  },
};

export function adminPath(view) {
  return view === "overview" ? "/admin" : `/admin/${view}`;
}

export function adminViewFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/admin") return "overview";
  const match = normalized.match(/^\/admin\/([^/]+)$/);
  return match && Object.hasOwn(adminViews, match[1]) ? match[1] : null;
}

export function adminNavigation(pathname) {
  const view = adminViewFromPath(pathname);
  return Object.entries(adminViews).map(([key, item]) => ({
    label: item.title,
    icon: item.icon,
    to: adminPath(key),
    selected: view === key,
  }));
}
