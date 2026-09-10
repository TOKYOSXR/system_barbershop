import type { UserRole } from "@prisma/client";

/**
 * Permission model (section 6 of the requirements).
 *
 * Permissions are expressed as `resource:action` strings. Each role maps to a
 * set of permissions. OWNER has everything; ADMIN manages the shop but not
 * billing/danger settings; BARBER only sees and edits their own data.
 */
export type Permission =
  // Dashboard
  | "dashboard:view"
  // Customers
  | "customers:view"
  | "customers:manage"
  // Barbers
  | "barbers:view"
  | "barbers:manage"
  // Services
  | "services:view"
  | "services:manage"
  // Appointments
  | "appointments:view" // all appointments of the tenant
  | "appointments:view_own" // only the barber's own appointments
  | "appointments:manage" // create/edit/cancel any appointment
  | "appointments:manage_own" // change status of own appointments
  // Finance
  | "finance:view"
  | "finance:manage"
  | "finance:view_own" // barber's own earnings/commissions
  // Reports
  | "reports:view"
  // Settings
  | "settings:view"
  | "settings:manage"
  // Billing / plans (OWNER only)
  | "billing:manage"
  // Users / team management
  | "users:manage";

const OWNER_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "customers:view",
  "customers:manage",
  "barbers:view",
  "barbers:manage",
  "services:view",
  "services:manage",
  "appointments:view",
  "appointments:manage",
  "finance:view",
  "finance:manage",
  "reports:view",
  "settings:view",
  "settings:manage",
  "billing:manage",
  "users:manage",
];

const ADMIN_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "customers:view",
  "customers:manage",
  "barbers:view",
  "barbers:manage",
  "services:view",
  "services:manage",
  "appointments:view",
  "appointments:manage",
  "finance:view",
  "finance:manage",
  "reports:view",
  "settings:view",
  "settings:manage",
];

const BARBER_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "appointments:view_own",
  "appointments:manage_own",
  "customers:view",
  "finance:view_own",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  BARBER: BARBER_PERMISSIONS,
};

/** Returns true when the given role holds the permission. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Returns true when the role holds every permission in the list. */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Returns true when the role holds at least one of the permissions. */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Full permission set for a role (useful for passing to the client). */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}
