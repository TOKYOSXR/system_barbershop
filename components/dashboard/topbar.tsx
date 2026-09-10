"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Scissors } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@prisma/client";

interface TopbarProps {
  name: string | null;
  email: string | null;
  role: UserRole;
  tenantName: string;
}

export function Topbar({ name, email, role, tenantName }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2 font-semibold md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scissors className="h-4 w-4" />
        </span>
        <span className="truncate">{tenantName}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-accent"
          >
            <Avatar name={name} />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {USER_ROLE_LABELS[role]}
                </p>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
