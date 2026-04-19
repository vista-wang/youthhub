import { Home, PenSquare, Flame, LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requireAuth?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "首页", icon: Home },
  { href: "/hot", label: "热门", icon: Flame },
  { href: "/create", label: "发帖", icon: PenSquare, requireAuth: true },
];

export const AUTH_PATHS = {
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
} as const;
