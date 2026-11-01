# AI-First Multi-Tenant HRMS — Frontend Specification

> **For the coding agent:** This file is the single source of truth for the web UI.
> The backend is specified in `implement.md` (FastAPI, multi-tenant by subdomain, JWT + refresh cookie,
> RBAC with data scopes, workflow engine, AI structured commands). Build the frontend **phase by phase,
> milestone by milestone**: Phase 1 MVP (section 14.1, F0–F11), then Phase 2 (section 15) only after the
> Phase 1 checklist is green. Keep every rule in section 4 and section 5, and match the design system in
> section 6 exactly. When something here conflicts with your defaults, this file wins. When something is
> missing, choose the simplest option consistent with this file and leave a `// TODO(spec):` comment.

---

## 1. Goals

1. A UI that feels like a **premium, calm, information-dense SaaS product** (think Linear / Stripe
   Dashboard / Rippling quality), not a generic admin template.
2. **Every screen respects permissions and data scope.** The UI hides what the user cannot do, but the
   backend is always the real guard — never rely on the UI for security.
3. **AI is first-class**: a command bar available everywhere that turns natural language into
   server-validated actions, with previews and confirmations.
4. Fast, accessible (WCAG 2.2 AA), responsive down to 360 px, dark mode included.

---

## 2. Tech stack (fixed)

| Area | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15+ (App Router)** + **React 19** + **TypeScript** (strict) | Public pages are Server Components (static/SSR, SEO). The logged-in tenant app is client-rendered (`"use client"` at the layout boundary) because the access token lives in browser memory only |
| Routing | Next.js App Router + **`middleware.ts`** for host-based rewrites (section 3) | In Next.js 16 the file is named `proxy.ts`; same logic. Type-safe URL search params with **nuqs** |
| Server state | **TanStack Query v5** (client) | All tenant API reads/writes go through it. No Next.js Server Actions or Route Handlers for tenant data — the FastAPI backend is the only API |
| Client state | **Zustand** (tiny stores only: auth session, UI prefs, command bar) | No Redux |
| Forms | **React Hook Form** + **Zod** (`@hookform/resolvers/zod`) | Zod schemas mirror backend Pydantic models |
| UI kit | **shadcn/ui** (Radix primitives) + **Tailwind CSS v4** | Theme via CSS variables (section 6) |
| Tables | **TanStack Table v8** | Server-side pagination (cursor), sorting, filters |
| Charts | **Recharts** | Themed with tokens |
| Icons | **lucide-react** | 16 px in dense UI, 20 px in nav |
| Dates | **date-fns** + `date-fns-tz` | Display in the user's tenant timezone |
| Toasts | **sonner** | |
| Command palette | **cmdk** | Powers both ⌘K navigation and the AI bar |
| Drag & drop | **dnd-kit** | Recruitment kanban, workflow step order |
| Lint/format | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier | |
| Tests | **Vitest** + **Testing Library**, **MSW** for API mocks, **Playwright** e2e | |
| Package manager | pnpm | |

Fonts: **Geist Sans** (UI) and **Geist Mono** (IDs, employee numbers, numbers in tables), loaded with
`next/font` from the `geist` package (`GeistSans`, `GeistMono`) and exposed as CSS variables.

Other Next.js specifics:
- `next-themes` for Light / Dark / System (adds `data-theme` on `<html>`, no flash).
- `next/image` for logos and marketing images; `next/link` for all internal navigation.
- `next/dynamic` (with `ssr: false` where needed) for heavy client-only pieces: charts, org chart, rich-text editor, kanban.
- Deployed as `output: "standalone"` in a Docker container behind nginx.

---

## 3. Hosts, apps and environment

The product runs on two kinds of host. **One Next.js app serves both.** `middleware.ts` looks at the
`Host` header and internally rewrites the request to one of two route trees, so the same URL path
(e.g. `/`) can show the landing page on the root domain and the dashboard on a tenant subdomain.

| Host | Example | Route tree | Renders |
|---|---|---|---|
| Root domain | `myhrm.example` | `src/app/site/...` | **Public site**: landing, pricing, tenant signup, "find my workspace", platform-admin console (`/platform/*`) |
| Tenant subdomain | `acme.myhrm.example` | `src/app/tenant/...` | **Tenant app**: login, all HR screens |

```ts
// src/middleware.ts   (Next.js 16: src/proxy.ts, export `proxy` instead of `middleware`)
import { NextResponse, type NextRequest } from "next/server";

const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN!;   // "myhrm.example" (or "localhost" in dev)

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const url = req.nextUrl.clone();

  // Block direct access to the internal trees.
  if (url.pathname.startsWith("/site") || url.pathname.startsWith("/tenant")) {
    return new NextResponse(null, { status: 404 });
  }

  const isRoot = host === BASE || host === `www.${BASE}`;
  if (isRoot) {
    url.pathname = `/site${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  const slug = host.endsWith(`.${BASE}`) ? host.slice(0, -(BASE.length + 1)) : "";
  if (!slug || slug.includes(".")) return new NextResponse(null, { status: 404 });

  url.pathname = `/tenant${url.pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-tenant-slug", slug);   // display only — never sent to the API
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts|images).*)"],
};
```

Client helper for components that need the slug (display only, e.g. the login card):

```ts
// src/lib/host.ts
export function getTenantSlug(): string | null {
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN!;
  const host = window.location.hostname;
  return host.endsWith(`.${base}`) ? host.slice(0, -(base.length + 1)) : null;
}
```

- The middleware only rewrites. It does **not** check whether the tenant exists or whether the user is
  logged in — the backend decides that (boot sequence, section 4.2).
- **Never** send `tenant_id` anywhere. The backend derives the tenant from the `Host` header.
- After signup, do a full navigation (`window.location.assign`) to `https://{slug}.{BASE}/login?welcome=1`.
- Dev: open `http://localhost:3000` (root) and `http://acme.localhost:3000` (tenant). Browsers resolve
  `*.localhost` to 127.0.0.1. The `allowedDevOrigins` option requires Next.js 15.2+; this project currently
  uses Next.js 15.0.0, so the option is omitted from `next.config.ts`.
- In dev, proxy the API with `next.config.ts` rewrites so the refresh cookie stays on the same host:

```ts
// next.config.ts
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/api/:path*", destination: `${process.env.API_INTERNAL_URL}/:path*` }]
      : [];   // in production nginx routes /api/* to FastAPI directly
  },
};
export default nextConfig;
```

> Important: the Next.js dev rewrite must forward the original `Host` header so FastAPI resolves the
> tenant. If it doesn't in your setup, run nginx locally (the compose file already has it) and point the
> browser at nginx instead.

Environment variables (`.env.example`):

```
NEXT_PUBLIC_BASE_DOMAIN=localhost
NEXT_PUBLIC_API_BASE=/api        # same host; nginx sends /api/* to FastAPI (keeps the refresh cookie same-origin)
API_INTERNAL_URL=http://localhost:8000   # dev rewrite target only, server-side
NEXT_PUBLIC_SENTRY_DSN=
```

> Assumption: in production nginx serves `*.myhrm.example` and `myhrm.example`, proxies `/api/*` →
> FastAPI (stripping `/api`, keeping `Host`) and everything else → the Next.js container. All paths in
> this document are written without the `/api` prefix, exactly as in `implement.md`.

**Rendering rules**
- `src/app/site/**`: Server Components by default. Landing and pricing are static (`export const revalidate = 3600`);
  signup and find-workspace are small client forms inside server pages.
- `src/app/tenant/(auth)/**` and `src/app/tenant/(app)/**`: the layout is a Client Component that runs the
  boot sequence. Pages are client components. **Do not fetch tenant data in Server Components** — the server
  has no access token and must never hold one.
- Add `export const dynamic = "force-dynamic"` to the tenant root layout so nothing tenant-specific is ever
  statically cached and shared between tenants.

---

## 4. Auth, session and the API client (do not deviate)

### 4.1 Tokens
- **Access token** (JWT, 15 min) is kept **in memory only** (Zustand store). Never in `localStorage`,
  `sessionStorage` or a readable cookie.
- **Refresh token** is an httpOnly cookie set by the server on the tenant host. The frontend never sees it;
  it just calls `POST /auth/refresh` with `credentials: "include"`.

### 4.2 Boot sequence (tenant host)
1. Show the full-page splash (logo + subtle shimmer, max 300 ms before it appears).
2. `POST /auth/refresh` → on success store the access token, then `GET /auth/me`.
3. `/auth/me` gives `{ user, tenant, roles, permissions, employee_id, data_scopes }`. Store it.
4. On 401 → go to `/login?next=<current path>`. On 404 (unknown tenant) → "Workspace not found" page
   with a link to the root domain. On 403 (suspended tenant) → "Workspace suspended" page.

### 4.3 API client (`src/lib/api.ts`)
A thin `fetch` wrapper. Requirements:
- `credentials: "include"`, `Authorization: Bearer <access>` when present, `Content-Type: application/json`.
- Generates an `X-Request-ID` (uuid) per call and keeps it for error reporting.
- **Single-flight refresh**: on a 401 from any call except `/auth/*`, run one shared `POST /auth/refresh`
  promise, then retry the original request once. If refresh fails → clear session, redirect to login.
- **Idempotency**: helper `withIdempotency()` adds `Idempotency-Key: <uuid>` to POSTs that create things or
  trigger side effects. The key is created **once per user intent** (when the form/dialog opens) and reused
  on retries, so a double click or network retry never duplicates. Required for: AI commands, import
  starts, employee create, leave submit, offers, hire.
- Parses the standard error shape into a typed `ApiError`:

```ts
type ApiErrorBody = { error: { code: string; message: string; details: Record<string, unknown>; request_id: string } };
class ApiError extends Error { status: number; code: string; details: Record<string, unknown>; requestId: string; }
```

### 4.4 Error handling rules

| Status | UI behavior |
|---|---|
| 422 | Map `details` field errors onto form fields (`setError`). Unknown shape → inline alert at the top of the form |
| 401 | Handled by the client (refresh / redirect). Never shown as a toast |
| 403 | Toast "You don't have permission to do that." On page loads → `<Forbidden />` empty state |
| 404 | Page → `<NotFound />` ("This record doesn't exist or you can't see it"). Never say "belongs to another tenant" |
| 409 | Show `error.message` inline near the conflicting field or as a dialog alert (duplicate, overlap, stale state). For stale state offer "Refresh" |
| 402 | Plan-limit dialog: "You've reached your plan's limit for {metric}." Button → Billing page (if `subscriptions.manage`) |
| 429 | Toast "Too many attempts. Try again in a moment." Disable the action for `Retry-After` seconds |
| 5xx / network | Toast with "Something went wrong" + copyable request id. Queries show a retry button |

Map known error codes to friendly copy in `src/lib/errorMessages.ts` (e.g. `leave.insufficient_balance`).
Fall back to the server `message`.

### 4.5 Pagination
Keyset: `?limit=50&cursor=…` → `{ items, next_cursor }`. Use `useInfiniteQuery`. Tables show a
**"Load more"** button at the bottom plus infinite scroll on mobile lists. No page numbers.

### 4.6 Query keys and invalidation
Key factory per domain: `qk.employees.list(filters)`, `qk.employees.detail(id)`, … After a mutation,
invalidate the affected lists/details and **always** `qk.me` when roles or memberships change.
Leave approve/reject also invalidates `qk.leave.balances`, `qk.workflow.myTasks`, `qk.attendance.*`.

### 4.7 Logout
`POST /auth/logout`, clear the query cache (`queryClient.clear()`), clear the store, go to `/login`.
"Log out everywhere" → `POST /auth/logout-all`. Use a `BroadcastChannel("auth")` so logging out in one
tab logs out all tabs.

---

## 5. Permissions and data scope in the UI

### 5.1 Hooks and components
```ts
const { can, canAny, scopeFor } = usePermissions();   // from /auth/me
can("employees.create")                 // boolean
scopeFor("employees.read")              // "all" | "department" | "team" | "self" | null
<Can perm="leave.approve">…</Can>      // renders children only if allowed
<Can perm="employees.update" fallback={<ReadOnlyBadge />}>…</Can>
```

### 5.2 Rules
- **Navigation** items, page routes, buttons, row actions and form fields are gated by permission.
  Each route segment's `layout.tsx` (client) wraps its children in `<RequirePermission perm="…">`, which
  renders `<Forbidden />` instead of an empty page. Keep the route → permission map in
  `src/lib/routePermissions.ts` and reuse it for the sidebar.
- **Hide** actions the user can never take; **disable with a tooltip** only when the action is
  temporarily impossible (e.g. "Approved leave can't be cancelled after it starts").
- Scope labels: show a small chip on list pages telling the user what they see —
  "All employees", "Your department", "Your team", "Only you".
- `self` scope users get a personal experience: Employees list is replaced by "My profile";
  they may edit only phone and address.
- Sensitive fields (salary, bank, national ID) are rendered **only when the API returns them**.
  Never derive visibility from the role name on the client.
- System roles (`is_system`) show a lock icon and are read-only in the Roles editor.
- When granting roles, gray out permissions the current user doesn't hold, with the tooltip
  "You can't grant a permission you don't have." Disable editing your own roles.

### 5.3 Permission codes referenced in this spec
`tenant.read`, `tenant.update`, `users.read`, `users.manage`, `roles.read`, `roles.manage`,
`employees.read|create|update|delete`, `attendance.read|manage`, `leave.read|request|approve`,
`workflows.read|manage`, `audit.read`, `notifications.manage`, `imports.read|create`,
`recruitment.read|manage`, `documents.read|manage`, `policies.read|manage`, `ai.execute`,
`subscriptions.read|manage`, `reports.read`.
The full list (31) comes from `GET /permissions`; the Roles editor must render whatever the server returns,
grouped by the prefix before the dot.

---

## 6. Design system

### 6.1 Personality
**"Quiet confidence."** Neutral, warm-gray surfaces; one deep accent (jade/teal ink) used sparingly for
primary actions and focus; generous whitespace around dense data; crisp 1 px borders instead of heavy
shadows; numbers in tabular mono. Motion is short and purposeful. No gradients on data surfaces, no
glassmorphism, no stock illustrations — use simple line-icon empty states.

### 6.2 Color tokens (CSS variables, `src/styles/tokens.css`)

```css
:root {
  --bg:            40 20% 98.5%;   /* app background, warm off-white */
  --surface:       0 0% 100%;      /* cards, tables, dialogs */
  --surface-2:     40 14% 96%;     /* subtle fills, table header, hover */
  --border:        40 10% 89%;
  --border-strong: 40 8% 80%;
  --text:          220 15% 13%;
  --text-muted:    220 8% 42%;
  --text-subtle:   220 6% 58%;

  --primary:       168 64% 26%;    /* deep jade */
  --primary-hover: 168 64% 22%;
  --primary-fg:    0 0% 100%;
  --primary-soft:  166 45% 93%;    /* selected rows, active nav */

  --ai:            256 70% 58%;    /* violet, used ONLY for AI surfaces */
  --ai-soft:       256 80% 96%;

  --success:       146 55% 34%;   --success-soft: 140 50% 94%;
  --warning:       36 92% 42%;    --warning-soft: 42 95% 92%;
  --danger:        2 70% 48%;     --danger-soft:  4 85% 95%;
  --info:          212 75% 46%;   --info-soft:    212 90% 95%;

  --ring:          168 64% 32%;
  --radius:        10px;
}

:root[data-theme="dark"] {
  --bg:            220 14% 7%;
  --surface:       220 13% 10%;
  --surface-2:     220 12% 13%;
  --border:        220 10% 18%;
  --border-strong: 220 9% 26%;
  --text:          40 15% 93%;
  --text-muted:    220 8% 66%;
  --text-subtle:   220 6% 50%;
  --primary:       166 52% 48%;
  --primary-hover: 166 52% 54%;
  --primary-fg:    220 20% 8%;
  --primary-soft:  168 35% 15%;
  --ai:            256 85% 72%;
  --ai-soft:       256 35% 18%;
  --success: 146 45% 50%; --success-soft: 146 30% 14%;
  --warning: 38 90% 58%;  --warning-soft: 38 40% 14%;
  --danger:  2 75% 62%;   --danger-soft:  2 40% 16%;
  --info:    212 80% 64%; --info-soft:    212 40% 16%;
  --ring:    166 52% 52%;
}
```
Theme options: Light / Dark / System (default System), handled by `next-themes` with
`attribute="data-theme"`; add `suppressHydrationWarning` on `<html>`.
Wire these into the shadcn theme names (`background`, `card`, `muted`, `accent`, `destructive`, …).

### 6.3 Typography
| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 30/36 | 600, tracking -0.02em | Dashboard greeting, marketing hero (48/52 there) |
| `h1` | 22/28 | 600, -0.01em | Page titles |
| `h2` | 17/24 | 600 | Card / section titles |
| `body` | 14/20 | 400 | Default |
| `body-sm` | 13/18 | 400 | Table cells, meta |
| `caption` | 12/16 | 500, uppercase, tracking 0.04em | Table headers, overlines |
| `mono` | 13/18 | 450, `font-variant-numeric: tabular-nums` | IDs, employee numbers, amounts, durations |

### 6.4 Spacing, radius, elevation
- 4 px grid. Page padding 24 px (desktop) / 16 px (mobile). Card padding 20 px. Table row height 44 px
  (comfortable) or 36 px (compact toggle, saved per user).
- Radius: inputs/buttons 8 px, cards 12 px, dialogs 14 px, pills 999 px.
- Elevation: cards use border only; popovers/dialogs `0 8px 24px -6px rgb(0 0 0 / 0.12)`; dark mode
  replaces shadows with `--border-strong`.

### 6.5 Motion
150 ms ease-out for hover/press; 200 ms for popovers/dialogs (fade + 4 px rise); sheets slide 240 ms.
Respect `prefers-reduced-motion` (disable translate, keep opacity). Skeletons shimmer at 1.4 s.

### 6.6 Status colors (use everywhere consistently)
| Domain status | Badge |
|---|---|
| `approved`, `present`, `active`, `completed`, `verified`, `hired`, `accepted` | success |
| `pending`, `awaiting_confirmation`, `in_progress`, `invited`, `half_day`, `scheduled` | warning |
| `rejected`, `absent`, `failed`, `suspended`, `declined`, `expired` | danger |
| `cancelled`, `draft`, `closed`, `withdrawn` | neutral (surface-2 + text-muted) |
| `on_leave`, `open`, `sent` | info |
| `completed_with_errors` | warning with alert icon |

Badges: soft background + strong text + 6 px dot. Never rely on color alone — the text label is always shown.

### 6.7 Core components to build first (`src/components/ui` + `src/components/app`)
`Button` (primary / secondary / ghost / danger / ai; sizes sm, md), `Input`, `Textarea`, `Select`,
`Combobox` (async search), `DatePicker`, `DateRangePicker`, `Checkbox`, `Switch`, `RadioGroup`,
`Badge`/`StatusBadge`, `Avatar` (initials fallback, deterministic color from id), `Card`, `StatCard`,
`Tabs`, `Dialog`, `Sheet` (right drawer for detail/edit), `DropdownMenu`, `Tooltip`, `Popover`,
`DataTable` (section 6.8), `EmptyState`, `ErrorState`, `Skeleton`s, `PageHeader` (title, description,
scope chip, primary action, secondary actions menu), `FilterBar`, `ConfirmDialog` (typed confirmation for
destructive actions), `Timeline` (history/audit), `FileDropzone`, `Kanban`, `KeyValueList`,
`PermissionMatrix`, `Stepper`.

### 6.8 DataTable behavior
- Sticky header, column visibility menu, density toggle, sortable columns (server-side sort params).
- Filter bar above: search (debounced 300 ms, in URL search params), chips for active filters, "Clear all".
- Row click opens a **right-side Sheet** with the detail; ⌘/Ctrl-click opens the full page.
- Row actions in a `⋯` menu on hover (always visible on touch).
- Bulk select only where the backend supports bulk actions (none in v1 except notifications read-all).
- States: skeleton rows (8) while loading, `EmptyState` with a primary action, `ErrorState` with retry.
- Filters, sort and search live in the URL so views are shareable.

---

## 7. App shell (tenant host)

```
┌──────────────┬─────────────────────────────────────────────────────────┐
│ [logo] Acme ▾│  Breadcrumbs            [⌘K Search]  [✦ Ask AI]  🔔  (A) │
│──────────────│─────────────────────────────────────────────────────────│
│ Home         │                                                         │
│ My space     │   PageHeader                                            │
│ Inbox    (3) │   ───────────────────────────────────────────────────   │
│──────────────│                                                         │
│ PEOPLE       │   Content                                               │
│ Employees    │                                                         │
│ Organization │                                                         │
│ Attendance   │                                                         │
│ Leave        │                                                         │
│ Recruitment  │                                                         │
│ Documents    │                                                         │
│ Policies     │                                                         │
│──────────────│                                                         │
│ INSIGHTS     │                                                         │
│ Reports      │                                                         │
│ Audit log    │                                                         │
│──────────────│                                                         │
│ ADMIN        │                                                         │
│ Workflows    │                                                         │
│ Imports      │                                                         │
│ Users & roles│                                                         │
│ Settings     │                                                         │
│──────────────│                                                         │
│ Plan: Growth │                                                         │
│ 142/200 emp. │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```
- Sidebar 248 px, collapsible to 64 px icon rail (state saved). On < 1024 px it becomes a drawer.
  On mobile (< 640 px) add a bottom tab bar: Home, Inbox, Ask AI (center, violet), Leave, Me.
- Sections and items appear only if the user has at least one relevant permission.
- **Inbox** badge = count of `GET /workflows/tasks/me` pending + unread notifications needing action.
- Top bar: workspace switcher (shows tenant name + logo; "Go to another workspace" links to root domain
  find-workspace page), global search (⌘K), **Ask AI** button (⌘J), notifications bell (popover),
  avatar menu (Profile, Preferences, Theme, Keyboard shortcuts, Log out, Log out everywhere).
- A thin top banner for: email not verified, plan limit ≥ 90 %, tenant in trial (days left).

Keyboard shortcuts: `⌘K` search/navigate, `⌘J` Ask AI, `g h` home, `g e` employees, `g l` leave,
`g i` inbox, `c` create (context primary action), `?` shortcut sheet, `Esc` close sheet.

---

## 8. Route map

### 8.1 Root domain (public app)
| Route | Screen |
|---|---|
| `/` | Landing: hero, AI demo animation, features grid, security section, pricing teaser |
| `/pricing` | Plans from the backend plans list (static fallback) |
| `/signup` | Tenant signup wizard (section 9.1) |
| `/find-workspace` | Enter slug → redirect to `https://{slug}.{BASE}/login` |
| `/platform/login`, `/platform/tenants` | Platform admin console (only for `is_platform_admin`) |

### 8.2 Tenant host
| Route | Screen | Permission |
|---|---|---|
| `/login`, `/forgot-password`, `/reset-password?token=`, `/verify-email?token=`, `/accept-invite?token=` | Auth | public |
| `/` | Home dashboard (role-aware) | any |
| `/me` | My space: profile, my attendance, my leave, my documents, my policies | any |
| `/inbox` | Approvals and tasks | any |
| `/employees`, `/employees/new`, `/employees/:id` (tabs) | Employees | `employees.read` |
| `/organization/departments`, `/organization/locations`, `/organization/chart` | Org | `tenant.read` |
| `/attendance`, `/attendance/schedules`, `/attendance/holidays`, `/attendance/corrections` | Attendance | `attendance.read` |
| `/leave`, `/leave/requests/:id`, `/leave/types`, `/leave/balances` | Leave | own / `leave.read` |
| `/recruitment/jobs`, `/recruitment/jobs/:id` (pipeline), `/recruitment/candidates`, `/recruitment/candidates/:id`, `/recruitment/applications/:id` | Recruitment | `recruitment.read` |
| `/documents` | Documents | own / `documents.read` |
| `/policies`, `/policies/:id` | Policies | own / `policies.read` |
| `/workflows`, `/workflows/:id`, `/workflows/executions`, `/workflows/executions/:id` | Workflows | `workflows.read` |
| `/imports`, `/imports/new`, `/imports/:id` | Bulk import | `imports.read` |
| `/reports`, `/reports/:kind` | Reports | `reports.read` |
| `/audit` | Audit log | `audit.read` |
| `/ai/history` | My AI commands | `ai.execute` |
| `/settings/general`, `/settings/members`, `/settings/roles`, `/settings/roles/:id`, `/settings/notifications`, `/settings/templates`, `/settings/billing` | Settings | per page |
| `/preferences` | Personal: theme, density, notification preferences | any |

---

## 9. Screens in detail

For **every** screen implement: loading skeleton, empty state (icon + one sentence + primary action if
allowed), error state with retry, 403 and 404 states, mobile layout.

### 9.1 Tenant signup (root) — `POST /tenants/signup`
Split layout: left = 3-step form, right = brand panel with a product screenshot and three trust points.
1. **Company**: company name → auto-suggest slug (kebab-case). Live check via
   `GET /tenants/check-slug?slug=` (debounced 400 ms) showing `acme.myhrm.example` with ✓ available /
   ✗ taken / ✗ reserved. Client Zod: 3–40 chars, `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`.
2. **You**: full name, work email, password (strength meter, min 12 chars, show/hide).
3. **Plan**: plan cards (default the trial plan). Submit with `Idempotency-Key`.
Success screen: "Your workspace is ready" + button that navigates to the new subdomain login.

### 9.2 Login and account pages
- Centered card (400 px) on `--bg`, tenant logo + name at the top (from a public tenant branding call if
  available; otherwise the slug title-cased).
- Fields: email, password, "Forgot password?". Generic error message only:
  "Email or password is incorrect." Lockout (from error code) → "Too many attempts. Try again in 15 minutes."
- Forgot password always shows "If an account exists, we've sent a link." Reset page: new password + confirm.
- Accept invite: set name + password, then auto-login.
- Verify email: auto-calls the endpoint and shows success / expired.

### 9.3 Home dashboard (role-aware) — `GET /reports/dashboard`
Greeting ("Good morning, Priya") + date. Grid of cards chosen by permissions:
- **Everyone**: Check-in card (big button, live clock in schedule timezone, today's worked time), my leave
  balances (ring chart per type), my pending requests, policies to acknowledge (K2), upcoming holidays.
- **Approvers** (`leave.approve` or has tasks): "Waiting on you" list with inline Approve / Reject.
- **HR / Owner (`all` scope)**: StatCards — headcount, joiners this month, attrition (90 d), on leave
  today, open positions; headcount trend line chart; department distribution bar chart; recent activity
  (audit) feed.
- **Recruiter**: open jobs, applications by stage, interviews today.
- An **AI suggestion strip** with 3 example prompts the user is allowed to run
  ("How many leave days do I have?", "Who is waiting on my approval?").

### 9.4 Employees
**List** (`GET /employees`): columns — Avatar+Name (+email under), Employee no. (mono), Department,
Title, Manager, Location, Status, Joined. Filters: department, location, status, manager, search.
Scope chip in header. Primary action **Add employee** (`employees.create`), secondary **Import**
(`imports.create`) and **Export**.

**Create** (`POST /employees`) — Sheet or full page with sections: Personal, Job (department combobox,
manager async combobox filtered to the tenant, title, location, work schedule, employment type, join date),
Compensation (only if the field is in the schema returned for create), Account ("Send login invite"
switch → assigns Employee role). Employee number shown as "Auto-generated". Handle 409 duplicate
(email/employee number) inline and 402 plan limit dialog. After success: toast + open the profile.

**Profile** (`/employees/:id`) — header: avatar, name, title, department, status badge, manager link,
actions (Edit, Invite to login, Deactivate). Tabs:
- *Overview*: key-value cards (contact, job, location, schedule).
- *Job & history*: `GET /employees/{id}/history` as a Timeline (hired, promoted, transfer, manager change).
- *Team*: `GET /employees/{id}/reports` as a mini org tree.
- *Attendance*: month calendar heatmap.
- *Leave*: balances + requests.
- *Documents*: their documents with verify/reject actions for `documents.manage`.
- *Activity*: audit entries for this entity (if `audit.read`).
Edit in a Sheet; manager picker blocks selecting self and shows the server's cycle error (409/422) inline.
`self` scope sees "My profile" with only phone/address editable. Delete = soft delete with typed confirmation.

### 9.5 Organization
- **Departments**: tree table (`GET /departments/tree`) with expand/collapse, head, headcount; add/edit
  in dialog with parent picker.
- **Locations**: table + dialog (name, address, timezone).
- **Org chart**: zoomable, pannable top-down chart from manager relationships; search to focus a person;
  click a node → profile sheet. Lazy-load children for large orgs.

### 9.6 Attendance
- **My attendance** (`/me` tab and Home card): check-in / check-out buttons (`POST /attendance/check-in|out`),
  month calendar with colored day states (present, half day, absent, on leave, holiday, weekend),
  worked hours per day, "Request correction" on a past day → dialog (date, check-in/out times, reason) →
  `POST /attendance/corrections`. Double check-in 409 → "You're already checked in."
- **Team attendance** (`GET /attendance`): table by employee × date range, with filters; summary row from
  `GET /attendance/summary?month=` (present %, absences, late).
- **Corrections queue**: pending corrections with approve/reject for `attendance.manage` or the assignee.
- **Schedules** and **Holidays** (`attendance.manage`): schedule editor (working days chips, start/end time,
  timezone, half-day threshold); holiday calendar with list + add dialog.

### 9.7 Leave (the showcase flow — polish this most)
- **Leave home** (`/leave`): balance cards per leave type (available / pending / used with a segmented bar),
  "Request leave" primary button, my requests table, and for approvers a tab **Approvals** (`GET /leave/approvals`).
- **Request leave dialog** (`POST /leave/requests`, idempotency key per dialog open):
  leave type select (shows available balance), date range picker that **greys out weekends and holidays**
  of the user's schedule, half-day toggles for first/last day, reason. Live summary:
  "3 working days · 9 available → 6 after approval" (client-side estimate, labelled "estimate"; the server
  number is authoritative). Errors: insufficient balance, overlap (409 → "You already have leave on these
  dates"), notice period, spans two years — shown inline.
- **Request detail** (`/leave/requests/:id`): status badge, dates, days, type, reason, **approval timeline**
  from the workflow execution (each step: assignee, status, decided at, comment), actions for the viewer:
  Approve / Reject (with optional comment, current approver only), Cancel (requester; disabled after start
  date with tooltip). Hide approve buttons on your own request.
- **Leave types** (`tenant.update`): table + editor (code, name, color, annual allocation, carry-forward,
  notice days, max consecutive days, half-day allowed).
- **Balances** (`leave.read` + scope): table employee × leave type.
- Team leave calendar: month view showing who is on leave (scope-filtered).

### 9.8 Inbox (approvals & tasks) — `GET /workflows/tasks/me`
Two-pane layout (list left 380 px, detail right). Filters: All / Approvals / Actions; Pending / Done.
Each item: entity icon, title ("Rahul Mehta · Annual leave · 12–14 Nov"), requester, due-in badge
(red when overdue). Detail shows the entity summary + workflow context + Approve / Reject / Complete
(`POST /workflows/tasks/{id}/approve|reject|complete`) with comment. Keyboard: `j/k` move, `a` approve,
`r` reject. Optimistic removal with undo-less rollback on error (stale 409 → refresh item).

### 9.9 Workflows (`workflows.read` / `workflows.manage`)
- **Definitions list**: name, entity type, active version, status, updated.
- **Definition detail**: versions list (draft / published, published versions locked with a lock icon),
  "New draft version". **Draft editor (v1 form-based, not a canvas)**: ordered list of step cards; each card
  edits `type` (approval / action / notification), assignee (kind + value pickers: manager of subject,
  department head, role picker, permission picker, user picker), optional fallback, `due_in_hours`,
  `when` condition row builder (field · operator · value — operators `== != > >= < <= in`), and transitions
  (`on_approve`, `on_reject` selects listing other steps + END_APPROVED / END_REJECTED), `on_timeout`.
  A read-only flow preview (vertical diagram) updates live. Validate with Zod mirroring the backend schema;
  show server publish errors per step. **Publish** has a confirmation explaining that running executions
  keep their version. Also offer a "View JSON" tab (read-only for published).
- **Executions**: table with status filters; detail page shows a step timeline, context JSON viewer, error
  message for `failed`, and **Retry** (`POST /workflows/executions/{id}/retry`).

### 9.10 Audit log — `GET /audit-logs`
Dense table: time (relative + exact on hover), actor (avatar or "System"/"AI" chip), action (mono code +
human label), entity (link), source badge (`api`, `ai` violet, `import`, `system`), IP. Filters: action,
entity type, actor, date range, source. Row expands to a **before/after diff** view (JSON diff, changed keys
highlighted). Read-only; no delete or edit affordance anywhere.

### 9.11 Notifications
- Bell popover: last 10, unread dot, "Mark all as read" (`POST /notifications/read-all`), click → deep link
  + `POST /notifications/{id}/read`. Poll every 30 s with TanStack Query (`refetchInterval`) and on window focus.
- `/preferences` → notification preferences matrix: event type × channel (in-app, email) switches
  (`GET/PUT /notifications/preferences`).
- `/settings/templates` (`notifications.manage`): template list, editor with subject + body (Jinja variables
  listed as insertable chips), live preview with sample data rendered **client-side as plain text only**
  (never inject HTML).

### 9.12 Bulk import
- `/imports/new`: 3-step stepper. (1) Choose entity type + **Download template**
  (`GET /imports/templates/{entity_type}`). (2) Dropzone: `.csv`/`.xlsx`, ≤ 10 MB validated client-side,
  shows file name/size; preview first 20 rows parsed client-side (Papaparse / SheetJS) with column header
  check against the template. (3) Confirm → `POST /imports` (multipart, idempotency key) → 202 → go to job page.
- `/imports/:id`: progress ring + counts (processed / succeeded / failed), status badge, polling every 2 s
  until terminal. When `completed_with_errors`: errors table (`GET /imports/{id}/errors`, row number, column,
  message) + **Download error report** (`/error-report`).
- `/imports`: history table.

### 9.13 Recruitment (`recruitment.read`; gated by plan feature `recruitment` → show upgrade card if off)
- **Jobs list**: title, department, location, status (draft/open/closed), applicants count. Open/Close actions.
- **Job pipeline** (`/recruitment/jobs/:id`): **Kanban** by application status/stage with dnd-kit.
  Dropping a card calls `POST /recruitment/applications/{id}/move` with the expected current state; on 409
  snap the card back and toast "This application was updated by someone else."
- **Candidates**: table + profile (contact, resume document, applications, interviews, notes).
- **Application detail**: stage header with move menu; tabs Interviews (schedule dialog: interviewer
  picker, datetime, duration; show clash error J4 inline; feedback form for the interviewer with rating
  1–5 + notes), Offers (create offer form, send, mark accepted/declined; only one live offer), Activity.
- **Hire** button (on accepted offer) → confirmation dialog prefilled with employee fields → `POST …/hire`
  → success redirects to the new employee profile.

### 9.14 Documents
- Table: name, type, owner (employee), status (pending/verified/rejected), expiry (warning badge if
  < 30 days), uploaded at.
- Upload flow: `POST /documents/upload-url` → `PUT` file directly to the presigned URL with progress bar
  (XHR for progress) → `POST /documents` to register. Client allowlist: PDF, PNG, JPG, DOCX; max size per
  server config. Never let the user type a storage key.
- Download: request `GET /documents/{id}/download-url` on click, then open it — never cache or prefetch
  these URLs (they expire in 5 min).
- `documents.manage`: Verify / Reject (with reason). `self` scope sees only their own documents in `/me`.

### 9.15 Policies
- Employee view: "To acknowledge" list (`GET /policies/pending`) → reader page with the policy body
  (render sanitized Markdown/HTML via DOMPurify) and a sticky footer "I have read and agree" →
  `POST /policies/versions/{id}/acknowledge` (idempotent; button turns into "Acknowledged on …").
- Admin (`policies.manage`): policy list, version editor (rich text, Tiptap), publish, and an
  acknowledgement tracker (`GET /policies/versions/{id}/acknowledgements`): progress bar, two tabs
  "Acknowledged" / "Not yet", export.

### 9.16 Reports (`reports.read`)
Report gallery cards → `/reports/headcount`, `/reports/attrition`, `/reports/leave`, `/reports/attendance`.
Each: filter bar (date range, department, location), chart(s) on top, table below, **Export CSV** →
`POST /reports/exports` (async) → toast "We'll notify you when it's ready" + notification with download.

### 9.17 Settings
- **General** (`tenant.update`): company name, logo upload, default timezone, week start, date format.
- **Members** (`users.read` / `users.manage`): table (name, email, roles, status: active/invited/suspended,
  last login). Invite dialog (`POST /memberships/invite`: email, name, roles multi-select). Row actions:
  change roles (`PUT /users/{id}/roles`), suspend, remove (typed confirm), resend invite. Disable actions on
  yourself and on the last Tenant Owner (with tooltip).
- **Roles** (`roles.read` / `roles.manage`): list (system roles locked) → role editor: name, description,
  **data scope** select with explanation for each option, and the **PermissionMatrix** (groups as rows,
  read/create/update/delete/manage columns where they apply, plus a flat checklist for odd codes) saved via
  `PUT /roles/{id}/permissions`. Show a diff summary before saving ("+3 permissions, −1").
- **Billing** (`subscriptions.read`): current plan card, usage meters (employees, AI commands this month,
  storage) with 80 % warning / 100 % danger colors, plan comparison and "Change plan" (`subscriptions.manage`,
  `POST /subscriptions/change-plan`) with confirmation.
- **Notifications / Templates**: see 9.11.

### 9.18 Platform admin console (root domain, `/platform`)
Separate minimal shell (no tenant sidebar). Tenants table: name, slug, plan, status, employees, created.
Actions Suspend / Activate with typed confirmation and reason. Visually distinct: a thin amber top border
and "Platform admin" label so it's never confused with a tenant.

---

## 10. AI command experience (M10) — the signature feature

### 10.1 Entry points
- **Ask AI** button in the top bar and `⌘J` → opens the **AI panel**: a right-side Sheet (440 px) on
  desktop, full-screen sheet on mobile. Violet accent (`--ai`) is used **only** here and on AI-sourced badges.
- From ⌘K palette: typing a sentence that doesn't match a page shows "Ask AI: “…”" as the first option.
- Only shown when `can("ai.execute")` and the plan has the `ai` feature (else an upgrade card).

### 10.2 Panel layout
- Header: "✦ Assistant", link to `/ai/history`.
- Message list (this session only, not a chat with memory): user bubble → assistant **result card**.
- Composer: auto-growing textarea, Enter to send, Shift+Enter newline, character limit counter (1,000).
- Suggested prompts (chips) filtered by permission:
  "How many leave days do I have?", "Request leave next Friday", "Show my pending approvals",
  "Check me in", "Find Amit in Engineering", "Add a new employee…" (only with `employees.create`).

### 10.3 Request flow
`POST /ai/commands { message }` with a fresh `Idempotency-Key` per send (reused on network retry).
Render the response by `status`:

| Status | Card |
|---|---|
| `executed` / `completed` | Success card: icon, the **server-built** result message, and structured result (e.g. balances mini-table, created employee link, list of approvals with inline actions) |
| `awaiting_confirmation` | **Preview card** with a violet border: human-readable summary of exactly what will happen as key-value rows, a 10-minute countdown, buttons **Confirm** (`POST /ai/commands/{id}/confirm`) and **Cancel** (`…/cancel`). After expiry the buttons disable with "This request expired — ask again." |
| `needs_clarification` / ambiguous match | List of candidate records (avatar, name, department); clicking one sends a follow-up message that includes the chosen identifier |
| `rejected_permission` | Neutral card: "You don't have permission to do that." No retry button |
| `rejected_schema` / unknown intent | "I can't do that yet." + a short list of what the assistant can do |
| `failed` / business error | Error card with the server message (e.g. insufficient balance) and a link to the relevant page |
| quota / plan / 429 | Usage message and link to Billing for admins |

Rules:
- **Never** render model free text as HTML. All text is plain text; links come from structured fields only.
- The UI never decides that confirmation can be skipped — it only follows `status`.
- After any executed command, invalidate the relevant query keys (leave, attendance, employees, tasks).
- Show a subtle "Processing…" state with a three-dot animation; disable the composer while in flight;
  allow cancel of the HTTP request (AbortController) before the server responds.
- `/ai/history` (`GET /ai/commands`): table of message, intent (mono), status badge, created, link to the
  affected entity; detail drawer shows the gate outcomes timeline.
- Everywhere in the app, entities changed by AI show a small violet "✦ AI" chip in history/audit views.

---

## 11. Project structure

```
frontend/
  next.config.ts
  Dockerfile                 # multi-stage, output: standalone
  src/
    middleware.ts            # host → /site or /tenant rewrite (proxy.ts on Next.js 16)
    app/
      layout.tsx             # <html>, fonts, ThemeProvider (server)
      globals.css            # imports styles/tokens.css + Tailwind
      not-found.tsx
      site/                  # ROOT DOMAIN (Server Components by default)
        layout.tsx           # marketing header/footer
        page.tsx             # landing
        pricing/page.tsx
        signup/page.tsx
        find-workspace/page.tsx
        platform/            # platform admin console (client)
          login/page.tsx
          tenants/page.tsx
      tenant/                # TENANT SUBDOMAIN
        layout.tsx           # "use client": Providers (QueryClient, Toaster, Tooltip) + boot sequence
        (auth)/              # centered card layout, no shell
          login/page.tsx  forgot-password/page.tsx  reset-password/page.tsx
          verify-email/page.tsx  accept-invite/page.tsx
        (app)/               # signed-in area
          layout.tsx         # AppShell: Sidebar, Topbar, MobileTabBar, CommandPalette, AI panel; redirects to /login if no session
          page.tsx           # Home dashboard
          me/page.tsx
          inbox/page.tsx
          employees/page.tsx  employees/new/page.tsx  employees/[id]/page.tsx
          organization/departments/page.tsx  organization/locations/page.tsx  organization/chart/page.tsx
          attendance/...  leave/...  recruitment/...  documents/...  policies/...
          workflows/...  imports/...  reports/...  audit/page.tsx  ai/history/page.tsx
          settings/general/page.tsx  settings/members/page.tsx  settings/roles/[id]/page.tsx ...
          preferences/page.tsx
          error.tsx  loading.tsx  not-found.tsx
    features/                # one folder per backend domain (client code)
      auth/ employees/ organization/ attendance/ leave/ workflows/ inbox/ recruitment/
      documents/ policies/ imports/ notifications/ audit/ reports/ settings/ ai/ billing/ platform/
        api.ts               # typed fetchers + query keys + mutations (hooks)
        schemas.ts           # Zod schemas and TS types
        components/          # feature components
    components/
      ui/                    # shadcn primitives (themed)
      app/                   # PageHeader, DataTable, StatusBadge, EmptyState, Can, ScopeChip, ...
      layout/                # Sidebar, Topbar, MobileTabBar, CommandPalette
    lib/
      api.ts host.ts errors.ts errorMessages.ts idempotency.ts permissions.ts dates.ts format.ts
      queryKeys.ts sanitize.ts
    stores/ session.ts ui.ts aiPanel.ts
    styles/ tokens.css globals.css
    test/ msw/handlers/*.ts  setup.ts  factories.ts
  e2e/                       # Playwright
```
Rules: features import from `components/`, `lib/` and their own folder only — never from another feature's
internals (use its exported hooks). No `any`. No API calls inside components except via feature hooks.
Pages under `app/` stay thin: they read params/search params and render a feature component.
Put `"use client"` as low as possible on the `site/` side; on the `tenant/` side it starts at `tenant/layout.tsx`.
URLs inside the app never include `/site` or `/tenant` — those are internal rewrite targets.

---

## 12. Quality bar

**Accessibility**: semantic landmarks; every interactive element keyboard reachable with a visible focus
ring (`--ring`, 2 px offset); dialogs trap focus and restore it; icon-only buttons have `aria-label`;
form errors linked with `aria-describedby`; tables use proper `th scope`; color contrast ≥ 4.5:1;
live regions announce toasts and AI responses; `jsx-a11y` lint must pass; Playwright runs `axe` on key pages.

**Performance**: automatic route-level code splitting from the App Router; first-load JS per route
< 250 KB gzip (check `next build` output); charts, org chart, kanban and the rich-text editor loaded with
`next/dynamic`; marketing pages static with Lighthouse ≥ 95; lists virtualized above 200 rows (`@tanstack/react-virtual`); images lazy; `staleTime` 30 s
default, 5 min for reference data (departments, leave types, roles, permissions).

**Security (frontend share)**: access token in memory only; no `dangerouslySetInnerHTML` except through
`sanitize()` (DOMPurify) for policy bodies; no tenant id in requests; no secrets in the bundle; presigned
URLs fetched on demand; CSP with a per-request nonce generated in `middleware.ts` (Next.js applies it to
its own scripts), no `eval`; no Server Component, Route Handler or Server Action ever receives or stores
the access token, and nothing tenant-specific is statically cached; logout clears all caches;
error toasts show the request id but never stack traces.

**Responsiveness**: breakpoints 640 / 1024 / 1280. Tables collapse into card lists below 640 px.
Primary actions move to a floating button on mobile list pages. Touch targets ≥ 44 px.

**Copy tone**: short, plain, human. Sentence case for everything. Use "you". Errors say what happened and
what to do next. Dates like "Tue, 12 Nov" and relative times ("3 h ago") with exact time on hover.
Respect the tenant's date format setting.

**Internationalization-ready**: all strings through a tiny `t()` helper (`src/lib/i18n.ts`, English only for
now); numbers and dates via `Intl`.

---

## 13. Testing

- **Unit (Vitest)**: permission helpers, scope chip logic, error mapping, working-day estimate, workflow
  definition Zod schema + condition builder, idempotency key lifecycle, single-flight refresh.
- **Component (Testing Library + MSW)**: login errors, signup slug checker, leave request dialog (balance
  estimate, overlap 409, insufficient balance 422), approval inbox actions, role editor escalation guards,
  AI panel for every status in 10.3, DataTable loading/empty/error.
- **E2E (Playwright, against MSW or a seeded backend)**:
  1. Sign up → redirected to subdomain → log in as owner.
  2. Owner invites HR admin; HR admin adds an employee; employee accepts invite.
  3. Employee requests leave → manager approves from Inbox → balance and calendar update → notification shown.
  4. Bulk import with good and bad rows → error report downloadable.
  5. AI: "how many leave days do I have" (executes) and "add employee Rahul" (confirmation flow).
  6. Employee role cannot see Admin nav and gets the Forbidden page by URL.
- Visual check: Storybook is optional; at minimum a `/dev/kitchen-sink` route (dev builds only) showing all
  UI components in light and dark.

---


## 14. How to build: phase by phase

The frontend follows the same two phases as `implement.md`:

- **Phase 1 — MVP** (F0 → F11): everything a tenant needs to run HR day to day. Matches backend M0 → M11.
- **Phase 2 — Advanced** (FP2-9 → FP2-8): enterprise features. Matches backend P2-1 → P2-9.
  Start only when the Phase 1 checklist (14.3) is fully green.

**Rules for every milestone**
1. Build one milestone at a time, in order. Do not start the next one until the current one meets its
   "Done when" line.
2. If the backend endpoint for a milestone is not ready, build against **MSW mocks** that return exactly the
   shapes in `implement.md`, then switch to the real API. Never invent endpoints.
3. Every screen ships with all states: loading, empty, error, 403, 404, mobile, light + dark (section 9).
4. Each milestone ends with: lint + type-check clean, its tests from section 13 passing, and a short note
   in `CHANGELOG.md` listing the screens added.

> **Prompting tip for the coding agent:** give one milestone per task, e.g.
> *"Read frontend.md and implement.md. Implement milestone F5 (Leave) only. Follow sections 4–6 and 9.7.
> Stop when the F5 'Done when' line is met."*

---

## 14.1 PHASE 1 — MVP

### F0 — Foundation  ·  backend M0

**Build**
- `pnpm create next-app` (App Router, TypeScript strict, Tailwind v4, ESLint, `src/` dir).
- shadcn/ui init; wire tokens from section 6.2 into `src/styles/tokens.css` and the shadcn theme.
- `next/font` Geist Sans + Mono; `next-themes` (Light / Dark / System).
- `src/middleware.ts` host rewrite (section 3); empty `app/site` and `app/tenant` trees with placeholder pages.
- `src/lib/api.ts` client (section 4.3): request id, error parsing into `ApiError`, single-flight refresh,
  `withIdempotency()`.
- TanStack Query provider, Zustand stores (`session`, `ui`, `aiPanel`), sonner toaster.
- Core UI components from section 6.7 and the `/dev/kitchen-sink` page.
- MSW setup for dev and tests; Vitest + Testing Library; Playwright with one smoke test.
- `next.config.ts` (standalone, dev `/api` rewrite, `allowedDevOrigins`), `.env.example`, Dockerfile.

**Screens**: kitchen sink, placeholder landing (root), placeholder login (tenant), 404.

**Done when**: `localhost:3000` shows the site tree, `acme.localhost:3000` shows the tenant tree,
`/site` and `/tenant` return 404 directly, kitchen sink looks right in light and dark, CI runs lint +
type-check + one unit test + one Playwright test.

---

### F1 — Public site, auth and app shell  ·  backend M1

**Build**
- Root domain: landing page (hero, features, security, pricing teaser), `/pricing`, `/signup` wizard
  (section 9.1) with live slug check, `/find-workspace`.
- Tenant auth pages (section 9.2): login, forgot password, reset password, verify email, accept invite.
- Boot sequence (section 4.2): splash → refresh → `/auth/me` → store session; "Workspace not found" and
  "Workspace suspended" pages.
- App shell (section 7): sidebar, top bar, mobile tab bar, avatar menu, theme switch, logout, logout
  everywhere, multi-tab logout via `BroadcastChannel`.
- Settings → General (`GET/PATCH /tenants/current`).

**Endpoints**: `/tenants/signup`, `/tenants/check-slug`, `/tenants/current`, `/auth/*`.

**Done when**: a new tenant can sign up on the root domain, land on its subdomain login, sign in, see the
shell, reload the page and stay signed in (refresh works), and log out in all tabs. Login never reveals
whether an email exists. Lockout and 429 show the right messages.

---

### F2 — Permissions, members and roles  ·  backend M2

**Build**
- `usePermissions()`, `<Can>`, `<RequirePermission>`, `ScopeChip`, `src/lib/routePermissions.ts` (section 5).
- Sidebar and routes gated by permission; `<Forbidden />` page.
- Settings → Members (invite, change roles, suspend, remove) and Settings → Roles (list, role editor with
  data scope and `PermissionMatrix`, diff summary before save) — section 9.17.
- Escalation guards in the UI: can't grant what you don't hold, can't edit own roles, last owner protected,
  system roles locked.

**Endpoints**: `/permissions`, `/roles*`, `/users*`, `/memberships*`.

**Done when**: logging in as each of the 7 system roles shows only the nav and actions that role allows;
opening a forbidden URL shows `<Forbidden />`; role changes refresh `/auth/me`.

---

### F3 — Organization and employees  ·  backend M3

**Build**
- `DataTable` with cursor pagination, URL filters, sort, density, column menu, row → Sheet (section 6.8).
- Employees list, create (Sheet), profile with tabs, edit, invite to login, soft delete (section 9.4).
- `self` scope: "My profile" with only phone and address editable.
- Organization: departments tree, locations, org chart (section 9.5); work schedules and holidays editors.

**Endpoints**: `/employees*`, `/departments*`, `/locations*`, `/work-schedules*`, `/holidays*`.

**Done when**: HR can add, edit and soft-delete employees; duplicate → inline 409; plan limit → 402 dialog;
manager cycle shows the server error; the list shows the right rows and scope chip for all four scopes.

---

### F4 — Attendance  ·  backend M4

**Build** (section 9.6)
- Check-in card (Home and `/me`), my month calendar, request correction dialog.
- Team attendance table with monthly summary; corrections queue with approve / reject.

**Endpoints**: `/attendance/*`.

**Done when**: an employee can check in and out (double check-in → friendly 409), see their month, and
request a correction; a manager can approve it and the calendar updates.

---

### F5 — Leave (showcase flow)  ·  backend M5

**Build** (section 9.7)
- Leave home with balance cards, request dialog (weekends/holidays greyed out, half days, live estimate),
  my requests, request detail with approval timeline, approve / reject / cancel.
- Leave types editor, balances table, team leave calendar.

**Endpoints**: `/leave/*`.

**Done when**: request → approve → balance, calendar and attendance update without a page reload;
insufficient balance and overlap errors show inline; you cannot approve your own request; cancel after
start date is disabled with a tooltip. This flow gets the most polish.

---

### F6 — Inbox and workflows  ·  backend M6

**Build**
- Inbox two-pane view with keyboard shortcuts and optimistic decisions (section 9.8).
- Leave approvals now come from workflow tasks (switch from the F5 single-approver view).
- Workflows: definitions list, versions, form-based draft editor with live flow preview, publish
  confirmation, executions list and detail with retry (section 9.9).

**Endpoints**: `/workflows/*`.

**Done when**: a two-step leave workflow can be built and published in the UI, a request walks through
both steps in the Inbox, a published version is read-only, and a failed execution can be retried.

---

### F7 — Notifications and audit  ·  backend M7

**Build**
- Bell popover with polling, mark read / read all; notification preferences matrix; template editor with
  plain-text preview (section 9.11).
- Audit log with filters, source badges and before/after diff (section 9.10); "Activity" tab on profiles.

**Endpoints**: `/notifications*`, `/audit-logs`.

**Done when**: approving leave makes a notification appear for the employee within 30 s; every change made
in F1–F6 is visible in the audit log; the audit UI has no edit or delete actions.

---

### F8 — Bulk import  ·  backend M8

**Build** (section 9.12)
- 3-step import wizard with template download, client-side validation and preview; job page with live
  progress, row errors and error report download; import history.

**Endpoints**: `/imports*`.

**Done when**: uploading a file with good and bad rows ends `completed_with_errors` with the exact failed
rows listed and downloadable; double-clicking "Start import" creates only one job.

---

### F9 — Recruitment, documents and policies  ·  backend M9

**Build**
- Recruitment: jobs, kanban pipeline with drag and drop (409 snaps back), candidates, application detail
  with interviews, offers and **Hire** (section 9.13). Upgrade card when the plan lacks recruitment.
- Documents: presigned upload with progress, register, on-demand download, verify / reject (section 9.14).
- Policies: to-acknowledge list, reader with sticky acknowledge footer, admin editor and tracker (section 9.15).

**Endpoints**: `/recruitment/*`, `/documents*`, `/policies*`.

**Done when**: a candidate can go from application → interview → offer → hire and appear as an employee;
a document uploads, verifies and downloads; a published policy shows up for employees and the tracker counts
acknowledgements.

---

### F10 — AI assistant  ·  backend M10

**Build** (section 10)
- AI panel (⌘J and top-bar button, full screen on mobile), suggested prompts filtered by permission.
- Result cards for every status, confirmation preview with 10-minute countdown, candidate picker for
  ambiguous names, cancel in-flight request.
- ⌘K "Ask AI" option, `/ai/history`, violet "✦ AI" chips in audit and history views.

**Endpoints**: `/ai/commands*`.

**Done when**: "How many leave days do I have?" answers instantly; "Add employee Rahul…" shows a preview and
only runs after Confirm; an Employee asking to create someone sees the permission card; nothing from the
model is rendered as HTML; double send executes once.

---

### F11 — Dashboard, reports, billing, polish  ·  backend M11

**Build**
- Role-aware Home dashboard (section 9.3).
- Reports gallery and the four reports with async CSV export (section 9.16).
- Settings → Billing with usage meters and plan change; plan-limit banners.
- Platform admin console on the root domain (section 9.18).
- Quality pass: accessibility (axe on key pages), performance budget, CSP nonce, mobile review of every
  screen, full Playwright suite (section 13), README.

**Endpoints**: `/reports/*`, `/subscriptions/*`, `/platform/*`.

**Done when**: the Phase 1 checklist below is fully green.

---

## 14.2 Phase 1 timeline (one developer, alongside the backend)

| Week | Frontend milestones | Backend milestones |
|---|---|---|
| 1 | F0, F1 | M0, M1 |
| 2 | F2, F3 | M2, M3 |
| 3 | F4, F5 | M4, M5 |
| 4 | F6, F7 | M6, M7 |
| 5 | F8, F9 | M8, M9 |
| 6 | F10 | M10 |
| 7 | F11, full test pass, README | M11 |

## 14.3 Phase 1 definition of done

- [ ] One Next.js app serves the root domain and tenant subdomains via middleware rewrites; `/site/*` and `/tenant/*` return 404 when hit directly; no request ever contains a tenant id.
- [ ] No tenant data is fetched or cached on the Next.js server; the tenant area is client-rendered and `force-dynamic`.
- [ ] Access token only in memory; refresh is single-flight; multi-tab logout works.
- [ ] Every nav item, route, button and field is permission-gated; scope chip on every list page.
- [ ] Standard error shape mapped everywhere (422 field errors, 404 for other-tenant ids, 402 limit dialog, 409 inline).
- [ ] Leave end-to-end flow is polished: request → approval in Inbox → balances, calendar, notification update.
- [ ] Import wizard with live progress and downloadable error report.
- [ ] AI panel handles every status, confirmation previews with expiry, never renders model HTML.
- [ ] Light and dark themes match the tokens; WCAG AA; axe clean on key pages.
- [ ] Mobile usable at 360 px; bottom tab bar; tables become cards.
- [ ] Vitest + Playwright suites green in CI; `next build` shows < 250 KB first-load JS per route.
- [ ] README: setup, env vars, dev subdomains (`acme.localhost:3000`), how the host rewrite works, folder structure, how to add a feature.

---

## 15. PHASE 2 — Advanced

Start only when 14.3 is fully green. Each workstream matches one backend workstream from `implement.md`
section 5. Recommended order: **FP2-9 first** (live updates are used by later workstreams), then by
business priority. Every Phase 2 screen follows the same design system, states and permission rules as Phase 1.

### FP2-9 — Live updates and scale  ·  backend P2-9

**Build**
- Replace polling with a live channel for notifications, Inbox counts, import progress and AI status
  (Server-Sent Events or WebSocket from the backend; keep polling as a fallback when the connection drops).
- On each event, invalidate the matching TanStack Query keys instead of refetching everything.
- Connection indicator in the top bar (small dot; tooltip "Live" / "Reconnecting…").
- Load test the UI against large tenants: virtualized lists everywhere above 200 rows, org chart with
  lazy children, no page fetching more than one page of data at a time.

**Done when**: approving leave in one browser updates the other user's Inbox and bell within 2 s with no
polling; killing the connection falls back to polling without errors.

### FP2-1 — SSO, MFA and access reviews  ·  backend P2-1

**Build**
- Login page: "Continue with SSO" button(s) for the tenant's providers; password form hidden when
  `enforce_sso` is on (with a small "Owner break-glass login" link).
- SSO callback page with clear errors (expired, wrong account, not allowed domain).
- MFA: set up TOTP (QR code + manual key), verify step at login, recovery codes (show once, download,
  regenerate), "MFA required" gate for owners and HR admins.
- Settings → Security: identity providers (OIDC / SAML forms, test connection), allowed domains,
  JIT provisioning switch, enforce SSO switch, SCIM tokens (create — shown once — and revoke).
- Access review report: users, roles, last login, MFA status; export.

**Done when**: a tenant can configure OIDC, sign in through it, enforce SSO, and an owner must use MFA.

### FP2-2 — Shifts and rosters  ·  backend P2-2

**Build**
- Shift catalogue (name, time, color).
- Weekly roster grid: employees × days, drag shifts into cells, bulk assign by department, rule
  violations shown inline (rest time, weekly hours, on leave), publish roster with confirmation.
- Employee view: "My shifts" week view on Home and `/me`; request a swap (goes to the Inbox).
- Attendance screens show the assigned shift and overtime.

**Done when**: a manager can build and publish a week's roster with rule warnings, and a swap request
goes through the Inbox.

### FP2-3 — Advanced recruitment (ATS)  ·  backend P2-3

**Build**
- Per-job pipeline editor (add, rename, reorder stages; map each to a coarse status).
- Kanban uses the custom stages; candidate score badge.
- Automation rules builder: trigger · conditions · actions picked from fixed lists (no code), run history.
- Public careers page per tenant on its subdomain (`/careers`, `/careers/:jobId`) — server-rendered for
  SEO, application form with file upload and CAPTCHA.
- Scorecards for interviews; offer letter preview from templates.
- AI resume screening shown as a **suggestion** card (score + summary + "why") that the recruiter accepts
  or ignores — never an automatic reject.

**Done when**: a candidate can apply from the public careers page, an automation moves them, and a
recruiter can review the AI suggestion before deciding.

### FP2-4 — Document OCR  ·  backend P2-4

**Build**
- Document list shows processing state (scanning → reading → ready / needs review).
- Review screen: document preview on the left, extracted fields on the right with confidence badges;
  the reviewer confirms or edits each value; nothing is applied until "Confirm".
- "Needs review" queue for `documents.manage`.

**Done when**: an uploaded ID shows extracted fields, low-confidence ones are flagged, and confirmed
values update the employee record (with an audit entry).

### FP2-5 — Visual workflow builder  ·  backend P2-5

**Build**
- Canvas editor (React Flow) that reads and writes the **same** definition JSON as the Phase 1 form editor;
  keep the form editor as an "Advanced" tab.
- Node palette: approval, action, notification, parallel (all / any), delay, webhook.
- Inline validation (unreachable steps, missing transitions, cycles without exit) before publish.
- "Test run" with a sample entity showing the path taken; version diff view; explicit "Migrate running
  executions" action with confirmation.

**Done when**: a workflow built on the canvas publishes and runs exactly like one built in the form editor.

### FP2-6 — Compliance  ·  backend P2-6

**Build**
- Settings → Compliance: retention policies per entity type, legal holds (create, list, release).
- Data subject requests: create export or erasure, status tracking, download export archive.
- Audit integrity panel: last verification time and result; signed audit export.
- Sensitive fields (salary, bank, national ID) masked by default with a "Reveal" button that logs access.

**Done when**: an admin can run an export and an erasure request end to end and see the audit integrity status.

### FP2-7 — Report builder and analytics  ·  backend P2-7

**Build**
- Report builder: pick dataset → dimensions → measures → filters → chart type, live preview, save, share
  with members, schedule delivery.
- Analytics pages: headcount trend, attrition, time to hire, absence rate, span of control — from snapshots,
  with date range compare.

**Done when**: an HR admin can build, save and schedule a custom report without writing any query.

### FP2-8 — Advanced AI assistant  ·  backend P2-8

**Build**
- The AI panel becomes a conversation: history kept per conversation, conversation list, clarifying
  questions answered inline ("Which Amit?").
- Multi-step plans: show the plan as a checklist preview; one Confirm for the whole plan; live progress per
  step; on failure, show clearly what was and wasn't done.
- Grounded answers (policy Q&A, "who is on leave tomorrow?") with source chips linking to the policy or records.
- Settings → AI: enable / disable intents per tenant.
- Streaming status for long-running AI jobs.

**Done when**: "Onboard Rahul, add him to Bangalore and give him 5 extra leave days" shows a 3-step plan,
runs after one Confirm, and reports each step's result.

---

## 15.1 Phase 2 definition of done

- [ ] The Phase 1 checklist (14.3) still passes after every workstream (runs in CI on every change).
- [ ] Every new screen has all states, permission gating, mobile layout and light + dark themes.
- [ ] Each workstream has its own tests and a README section.
- [ ] No user-built rule, report spec or AI output is ever rendered as HTML or executed in the browser.
- [ ] Public careers pages are server-rendered but contain only public job data — never tenant-internal data.
