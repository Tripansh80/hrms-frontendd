import { create } from "zustand";
import { setAccessToken } from "@/lib/api";

export type DataScope = "all" | "department" | "team" | "self";
export type Permission = string;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  employee_id: string | null;
  designation?: string | null;
  roles: string[];
  permissions: Permission[];
  data_scopes: Record<string, DataScope>;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  plan_features: string[];
  employee_count: number;
  employee_limit: number;
};

type AuthState = {
  user: AuthUser | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: AuthUser, tenant: Tenant, token: string) => void;
  clearSession: () => void;
  initSession: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (user, tenant, token) => {
    setAccessToken(token);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hrms_access_token", token);
        localStorage.setItem("hrms_user", JSON.stringify(user));
        localStorage.setItem("hrms_tenant", JSON.stringify(tenant));
      } catch (e) {
        console.error("Failed to save auth to localStorage", e);
      }
    }
    set({
      user,
      tenant,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearSession: () => {
    setAccessToken(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("hrms_access_token");
        localStorage.removeItem("hrms_user");
        localStorage.removeItem("hrms_tenant");
      } catch (e) {
        console.error("Failed to remove auth from localStorage", e);
      }
    }
    set({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initSession: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    try {
      const token = localStorage.getItem("hrms_access_token");
      const userStr = localStorage.getItem("hrms_user");
      const tenantStr = localStorage.getItem("hrms_tenant");

      if (token && userStr && tenantStr) {
        setAccessToken(token);
        set({
          accessToken: token,
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.warn("Could not load stored session", e);
    }

    set({ isLoading: false });
  },
}));
