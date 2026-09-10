"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { hasAnyPermission, type Permission } from "@/lib/permissions/permissions";
import type { UserRole } from "@prisma/client";

interface BottomNavProps {
  role: UserRole;
}

/** Mobile bottom navigation with the primary destinations. */
export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) =>
      item.mobile && hasAnyPermission(role, item.permissions as Permission[]),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-card md:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
