export function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN!;
  const host = window.location.hostname;
  return host.endsWith(`.${base}`) ? host.slice(0, -(base.length + 1)) : null;
}
