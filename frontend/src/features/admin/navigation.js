import {
  RiBankCardLine as CreditCard,
  RiShakeHandsLine as Handshake,
  RiDashboardLine as LayoutDashboard,
  RiChat1Line as MessageSquare,
  RiReceiptLine as Receipt,
  RiRestartLine as RotateCcw,
  RiGroupLine as Users,
} from "react-icons/ri";

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
  custom: {
    title: "Custom plan deals",
    description:
      "Review requests and agree on custom prices, seats, projects, and credits.",
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
    section: item.section,
    to: adminPath(key),
    selected: view === key,
  }));
}
