import { getTenantSlug } from "./host";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiErrorBody = {
  error?: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
  };
  detail?: string | Array<{ msg: string; loc: string[] }>;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;
  requestId: string;

  constructor(status: number, body: ApiErrorBody) {
    const msg =
      body.error?.message ||
      (typeof body.detail === "string" ? body.detail : null) ||
      (Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join(", ") : null) ||
      body.message ||
      "Request failed";

    super(msg);
    this.status = status;
    this.code = body.error?.code || "api_error";
    this.details = body.error?.details || {};
    this.requestId = body.error?.request_id || "";
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

// Initialize token from localStorage if available
if (typeof window !== "undefined") {
  try {
    accessToken = localStorage.getItem("hrms_access_token");
  } catch (e) {
    // Ignore localStorage error
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Keep browser requests same-origin. The Next.js proxy forwards the
    // tenant slug to the backend and avoids cross-origin requests.
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "/api";
}

async function doRefresh(): Promise<void> {
  const refreshUrl = `${getApiBaseUrl()}/auth/refresh`;

  const res = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "*/*",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("hrms_access_token");
    }
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  accessToken = data.access_token;
  if (typeof window !== "undefined" && accessToken) {
    localStorage.setItem("hrms_access_token", accessToken);
  }
}

async function refreshOnce(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function api<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts?: { signal?: AbortSignal; idempotencyKey?: string; token?: string }
): Promise<T> {
  const currentToken = opts?.token || accessToken;
  // Standard headers only (preventing browser CORS preflight rejections)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, */*",
  };

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }
  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  // Construct target URL
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  const url = `${base}${cleanPath}`;

  const doFetch = () =>
    fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: opts?.signal,
    });

  let res: Response;
  try {
    res = await doFetch();
    
    // If /api/... returned 404 on the backend, try without /api prefix
  } catch (netErr: any) {
    // If direct backend fails, fallback to local proxy /api
    const proxiedUrl = `/api${cleanPath}`;
    try {
      res = await fetch(proxiedUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: opts?.signal,
      });
    } catch {
      throw new Error(`Cannot reach backend at ${url}. Please ensure FastAPI is running on port 8000.`);
    }
  }

  // Single-flight refresh on 401 (except auth routes)
  if (res.status === 401 && !path.startsWith("/auth/")) {
    try {
      await refreshOnce();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      res = await doFetch();
    } catch {
      accessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("hrms_access_token");
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const errBody: ApiErrorBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
