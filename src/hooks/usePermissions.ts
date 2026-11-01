import { useAuthStore, type DataScope } from "@/store/authStore";

export function usePermissions() {
  const { user } = useAuthStore();

  const can = (perm: string): boolean =>
    user?.permissions.includes(perm) ?? false;

  const canAny = (...perms: string[]): boolean =>
    perms.some((p) => can(p));

  const scopeFor = (perm: string): DataScope | null =>
    user?.data_scopes[perm] ?? null;

  return { can, canAny, scopeFor };
}
