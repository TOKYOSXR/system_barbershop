import { describe, it, expect } from "vitest";

import {
  hasPermission,
  hasAnyPermission,
  getPermissionsForRole,
} from "@/lib/permissions/permissions";

describe("permissões por role", () => {
  it("OWNER tem billing e gestão total", () => {
    expect(hasPermission("OWNER", "billing:manage")).toBe(true);
    expect(hasPermission("OWNER", "finance:manage")).toBe(true);
    expect(hasPermission("OWNER", "settings:manage")).toBe(true);
  });

  it("ADMIN gerencia a barbearia mas NÃO faz billing", () => {
    expect(hasPermission("ADMIN", "finance:manage")).toBe(true);
    expect(hasPermission("ADMIN", "barbers:manage")).toBe(true);
    expect(hasPermission("ADMIN", "billing:manage")).toBe(false);
    expect(hasPermission("ADMIN", "users:manage")).toBe(false);
  });

  it("BARBER só acessa os próprios dados", () => {
    expect(hasPermission("BARBER", "appointments:view_own")).toBe(true);
    expect(hasPermission("BARBER", "appointments:manage_own")).toBe(true);
    expect(hasPermission("BARBER", "finance:view_own")).toBe(true);
    // Não pode ver a barbearia toda nem gerenciar
    expect(hasPermission("BARBER", "appointments:view")).toBe(false);
    expect(hasPermission("BARBER", "finance:view")).toBe(false);
    expect(hasPermission("BARBER", "barbers:manage")).toBe(false);
    expect(hasPermission("BARBER", "settings:manage")).toBe(false);
  });

  it("hasAnyPermission funciona com lista", () => {
    expect(
      hasAnyPermission("BARBER", ["appointments:view", "appointments:view_own"]),
    ).toBe(true);
    expect(hasAnyPermission("BARBER", ["finance:view", "reports:view"])).toBe(
      false,
    );
  });

  it("OWNER tem estritamente mais permissões que ADMIN, e ADMIN mais que BARBER", () => {
    const owner = getPermissionsForRole("OWNER").length;
    const admin = getPermissionsForRole("ADMIN").length;
    const barber = getPermissionsForRole("BARBER").length;
    expect(owner).toBeGreaterThan(admin);
    expect(admin).toBeGreaterThan(barber);
  });
});
