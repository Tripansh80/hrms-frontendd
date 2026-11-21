"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser, type Tenant } from "@/store/authStore";

type MeResponse = {
  user?: AuthUser;
  tenant?: Tenant;
  roles?: string[];
  permissions?: string[];
  employee_id?: string | null;
  designation?: string | null;
  data_scopes?: Record<string, any>;
  [key: string]: any;
};

export function useSession(requireAuth: boolean = true) {
  const { user, tenant, accessToken, isAuthenticated, isLoading, setSession, clearSession, initSession } = useAuthStore();
  const refreshedToken = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === "/login" || pathname.startsWith("/login");

    if (!isAuthenticated) {
      if (requireAuth && !isAuthPage) {
        router.push("/login");
      }
      return;
    }

    // If authenticated and on login page, redirect to home
    if (isAuthenticated && isAuthPage) {
      router.push("/");
      return;
    }

    // Always refresh the authorization profile once per token. This prevents
    // stale localStorage permissions from hiding newly granted dashboard access.
    if (accessToken && refreshedToken.current !== accessToken) {
      refreshedToken.current = accessToken;
      api<MeResponse>("GET", "/auth/me")
        .then((res) => {
          const authUser: AuthUser = res.user || {
            id: res.id || res.sub || "",
            name: res.name || res.full_name || res.email || "User",
            email: res.email || "",
            employee_id: res.employee_id || null,
            designation: res.designation || null,
            roles: res.roles || [],
            permissions: res.permissions || [],
            data_scopes: res.data_scopes || {},
          };

          const authTenant: Tenant = res.tenant || {
            id: res.tenant_id || "",
            name: res.tenant_name || "Workspace",
            slug: res.tenant_slug || "workspace",
            logo_url: res.logo_url || null,
            plan: res.plan || "growth",
            plan_features: res.plan_features || [],
            employee_count: res.employee_count || 0,
            employee_limit: res.employee_limit || 100,
          };

          setSession(authUser, authTenant, accessToken);
        })
        .catch((err) => {
          refreshedToken.current = null;
          console.warn("Failed to fetch /auth/me:", err);
        });
    }
  }, [isAuthenticated, isLoading, requireAuth, pathname, accessToken, router, setSession]);

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  return { user, tenant, isLoading, isAuthenticated, logout };
}
