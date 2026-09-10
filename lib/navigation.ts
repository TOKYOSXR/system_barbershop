import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Settings,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/permissions/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Any of these permissions grants access to the item. */
  permissions: Permission[];
  /** Show in the mobile bottom navigation (space is limited). */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: ["dashboard:view"],
    mobile: true,
  },
  {
    label: "Agendamentos",
    href: "/agendamentos",
    icon: CalendarDays,
    permissions: ["appointments:view", "appointments:view_own"],
    mobile: true,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    permissions: ["customers:view"],
    mobile: true,
  },
  {
    label: "Barbeiros",
    href: "/barbeiros",
    icon: UsersRound,
    permissions: ["barbers:view"],
  },
  {
    label: "Serviços",
    href: "/servicos",
    icon: Scissors,
    permissions: ["services:view"],
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: Wallet,
    permissions: ["finance:view", "finance:view_own"],
    mobile: true,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    permissions: ["reports:view"],
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    permissions: ["settings:view"],
  },
];
