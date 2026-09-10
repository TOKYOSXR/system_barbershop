"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { hasAnyPermission, type Permission } from "@/lib/permissions/permissions";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  role: UserRole;
  tenantName: string;
}

export function Sidebar({ role, tenantName }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) =>
    hasAnyPermission(role, item.permissions as Permission[]),
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scissors className="h-4 w-4" />
        </span>
        <span className="truncate">{tenantName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
