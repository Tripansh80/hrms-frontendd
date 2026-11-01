"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle, Building2, Globe } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { setAccessToken } from "@/lib/api";
import { getTenantSlug } from "@/lib/host";

export default function LoginPage() {
  const router = useRouter();
  const { setSession, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("admin@bovato.com");
  const [password, setPassword] = useState("BovatoTest@1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("bovato");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const detected = getTenantSlug() || "bovato";
      setSlug(detected);

      if (detected === "acme") {
        setEmail("admin@acme.com");
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const fillAdminCreds = () => {
    if (slug === "acme") {
      setEmail("admin@acme.com");
      setPassword("AcmeTest@1234");
    } else {
      setEmail("admin@bovato.com");
      setPassword("BovatoTest@1234");
    }
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const tenantSlug = slug || "bovato";
      const loginPayload = {
        email: email.trim(),
        password: password,
      };

      // Use the same-origin Next.js proxy so tenant login does not require
      // browser CORS access to the backend port.
      const primaryUrl = "/api/auth/login";
      const fallbackUrl = primaryUrl;

      let loginRes: Response | null = null;
      let usedUrl = primaryUrl;

      // Only standard headers to prevent CORS preflight rejections
      const standardHeaders = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      };

      try {
        loginRes = await fetch(primaryUrl, {
          method: "POST",
          headers: standardHeaders,
          body: JSON.stringify(loginPayload),
        });

        // If /api/auth/login returned 404, try /auth/login
        if (loginRes.status === 404) {
          usedUrl = fallbackUrl;
          loginRes = await fetch(fallbackUrl, {
            method: "POST",
            headers: standardHeaders,
            body: JSON.stringify(loginPayload),
          });
        }
      } catch (err: any) {
        // If network error on primary, try fallbackUrl
        try {
          usedUrl = fallbackUrl;
          loginRes = await fetch(fallbackUrl, {
            method: "POST",
            headers: standardHeaders,
            body: JSON.stringify(loginPayload),
          });
        } catch (fbErr: any) {
          throw new Error(
            `Unable to connect to backend at ${primaryUrl} or ${fallbackUrl}. Please check that your backend is running on port 8000.`
          );
        }
      }

      if (!loginRes || !loginRes.ok) {
        let errMsg = "Invalid email or password.";
        try {
          const errData = await loginRes.json();
          errMsg = errData.detail || errData.message || errData.error?.message || errMsg;
        } catch {
          if (loginRes && loginRes.status === 401) {
            errMsg = "Invalid email or password.";
          }
        }
        setError(errMsg);
        setLoading(false);
        return;
      }

      // Successful login -> extract access_token
      const tokenData = await loginRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        setError("Login succeeded but no access token was returned.");
        setLoading(false);
        return;
      }

      // Register token in API client
      setAccessToken(accessToken);

      // Call GET /api/auth/me or /auth/me on backend with Bearer token
      const mePrimaryUrl = "/api/auth/me";
      const meFallbackUrl = mePrimaryUrl;

      const authHeaders = {
        "Accept": "*/*",
        "Authorization": `Bearer ${accessToken}`,
        "X-Tenant-Slug": tenantSlug,
      };

      let meRes: Response | null = null;
      try {
        meRes = await fetch(mePrimaryUrl, {
          method: "GET",
          headers: authHeaders,
        });

        if (meRes.status === 404) {
          meRes = await fetch(meFallbackUrl, {
            method: "GET",
            headers: authHeaders,
          });
        }
      } catch (meErr) {
        try {
          meRes = await fetch(meFallbackUrl, {
            method: "GET",
            headers: authHeaders,
          });
        } catch {
          console.warn("Could not reach /auth/me:", meErr);
        }
      }

      let userData: any = null;
      if (meRes && meRes.ok) {
        try {
          userData = await meRes.json();
        } catch {
          // Keep null
        }
      }

      // Format user and tenant data
      const user = {
        id: userData?.user?.id || userData?.id || "user-1",
        name: userData?.user?.name || userData?.name || userData?.full_name || email.split("@")[0],
        email: email,
        employee_id: userData?.user?.employee_id || userData?.employee_id || null,
        designation: userData?.user?.designation || userData?.designation || null,
        roles: userData?.user?.roles || userData?.roles || ["admin"],
        permissions: userData?.user?.permissions || userData?.permissions || ["*"],
        data_scopes: userData?.user?.data_scopes || userData?.data_scopes || {},
      };

      const tenant = {
        id: userData?.tenant?.id || userData?.tenant_id || "tenant-1",
        name: userData?.tenant?.name || userData?.tenant_name || (tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)),
        slug: tenantSlug,
        logo_url: userData?.tenant?.logo_url || null,
        plan: userData?.tenant?.plan || "growth",
        plan_features: userData?.tenant?.plan_features || [],
        employee_count: userData?.tenant?.employee_count || 142,
        employee_limit: userData?.tenant?.employee_limit || 500,
      };

      // Store in Zustand & localStorage
      setSession(user, tenant, accessToken);

      // Redirect directly to company dashboard
      router.push("/");
    } catch (err: any) {
      console.error("Login exception:", err);
      setError(err.message || "Failed to connect to the authentication server. Please check your network and backend.");
      setLoading(false);
    }
  };

  const workspaceName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Workspace";
  const targetBackendDisplay = `http://${slug || "bovato"}.localhost:8000/api/auth/login`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/5">
        {/* Workspace Brand Badge */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ai to-primary shadow-md">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            <span>{workspaceName} Workspace</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to {workspaceName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your credentials to access your company HRMS.
          </p>

          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-mono text-subtle">
            <Globe className="h-3 w-3" />
            <span className="truncate max-w-[280px]">{targetBackendDisplay}</span>
          </div>
        </div>

        {/* Quick Fill Helper for Demo / Testing */}
        <div className="mb-5 rounded-lg border border-ai/20 bg-ai-soft/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ai">Demo credentials</span>
            <button
              type="button"
              onClick={fillAdminCreds}
              className="rounded bg-ai/10 px-2 py-1 text-[11px] font-semibold text-ai transition-colors hover:bg-ai/20"
            >
              Autofill admin
            </button>
          </div>
          <p className="mt-1 text-[11px] font-mono text-subtle">
            {slug === "acme" ? "admin@acme.com / AcmeTest@1234" : "admin@bovato.com / BovatoTest@1234"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger-soft p-3 text-xs text-danger animate-in fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-subtle" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-subtle" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-subtle hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>
            Looking for a different workspace?{" "}
            <a
              href="http://localhost:3000/find-workspace"
              className="font-medium text-primary transition-colors hover:underline"
            >
              Switch workspace
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
