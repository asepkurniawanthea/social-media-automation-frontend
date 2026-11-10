import { lazy } from "react";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Database,
  BarChart2,
  Send,
  Layout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Role = "ADMIN" | "EDITOR" | "SCHEDULER" | "VIEWER";

export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: Role[];
  component: ComponentType;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["ADMIN", "EDITOR", "SCHEDULER", "VIEWER"],
    component: lazy(() => import("../pages/Dashboard")),
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    allowedRoles: ["ADMIN"],
    component: lazy(() => import("../pages/Users")),
  },
  {
    name: "Sources",
    href: "/sources",
    icon: Database,
    allowedRoles: ["ADMIN", "EDITOR"],
    component: lazy(() => import("../pages/Sources")),
  },
  {
    name: "Articles",
    href: "/articles",
    icon: FileText,
    allowedRoles: ["ADMIN", "EDITOR"],
    component: lazy(() => import("../pages/Articles")),
  },
  {
    name: "Contents",
    href: "/contents",
    icon: Layout,
    allowedRoles: ["ADMIN", "EDITOR"],
    component: lazy(() => import("../pages/Contents")),
  },
  {
    name: "Posts",
    href: "/posts",
    icon: Send,
    allowedRoles: ["ADMIN", "EDITOR", "SCHEDULER"],
    component: lazy(() => import("../pages/Posts")),
  },
  {
    name: "Post Metrics",
    href: "/post-metrics",
    icon: BarChart2,
    allowedRoles: ["ADMIN", "VIEWER"],
    component: lazy(() => import("../pages/PostMetrics")),
  },
];
