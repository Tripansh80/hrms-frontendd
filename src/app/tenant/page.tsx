"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  Search,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Employee = {
  id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string | null;
  status: "onboarding" | "active" | "on_notice" | "suspended" | "exited";
  joining_date: string;
  department_name: string | null;
  invitation_status: "not_invited" | "invited" | "active";
};

type EmployeesResponse = {
  items: Employee[];
  next_cursor: string | null;
};

type DashboardResponse = {
  generated_at: string;
  widgets: {
    kpis?: { active_employees?: number };
    hiring_funnel?: { status: "not_available" };
    people_cost?: { status: "not_available" };
  };
};

type DashboardView = "admin" | "hr" | "manager" | "employee";
type AvailableDashboardsResponse = { dashboards: DashboardView[]; default: DashboardView | null };

const statusStyles: Record<Employee["status"], string> = {
  active: "bg-success-soft text-success",
  onboarding: "bg-ai-soft text-ai",
  on_notice: "bg-warning-soft text-warning",
  suspended: "bg-danger-soft text-danger",
  exited: "bg-muted text-muted-foreground",
};

const invitationStyles: Record<Employee["invitation_status"], string> = {
  active: "text-success",
  invited: "text-warning",
  not_invited: "text-muted-foreground",
};

function initials(employee: Employee) {
  return `${employee.first_name[0] ?? ""}${employee.last_name[0] ?? ""}`.toUpperCase();
}

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableDashboards, setAvailableDashboards] = useState<DashboardView[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardView>("admin");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canOpenAnyDashboard = availableDashboards.length > 0;
  const firstName = user?.name?.split(" ")[0] || "there";
  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees.slice(0, 8);
    return employees
      .filter((employee) =>
        `${employee.first_name} ${employee.last_name} ${employee.email} ${employee.department_name ?? ""}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 8);
  }, [employees, query]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    api<AvailableDashboardsResponse>("GET", "/dashboards/me")
      .then((available) => {
        if (!active) return;
        setAvailableDashboards(available.dashboards);
        setSelectedDashboard(available.default || "employee");
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load the admin dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedDashboard || !availableDashboards.length) return;
    let active = true;
    setLoading(true);
    Promise.all([
      api<DashboardResponse>("GET", `/dashboards/${selectedDashboard}`),
      api<EmployeesResponse>("GET", "/employees?limit=100"),
    ])
      .then(([dashboardResponse, employeesResponse]) => {
        if (!active) return;
        setDashboard(dashboardResponse);
        setEmployees(employeesResponse.items);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load the dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDashboard, availableDashboards.length]);

  if (loading && !availableDashboards.length) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="border-primary/20 bg-primary-soft">
          <p className="text-sm text-muted-foreground">Loading your workspace dashboard...</p>
        </Card>
      </div>
    );
  }

  if (error && !availableDashboards.length) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="border-danger/30 bg-danger-soft">
          <ShieldCheck className="h-6 w-6 text-danger" />
          <h1 className="mt-4 text-2xl font-bold">Dashboard could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh the page after confirming the backend is running and your session is valid.
          </p>
        </Card>
      </div>
    );
  }

  if (!canOpenAnyDashboard) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="border-primary/20 bg-primary-soft">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your workspace dashboard is not available for this role yet. Open My Space to manage your personal HR tasks.
          </p>
          <Link href="/me" className="mt-5 inline-flex">
            <Button>Open My Space <ArrowUpRight className="h-4 w-4" /></Button>
          </Link>
        </Card>
      </div>
    );
  }

  const activeEmployees = dashboard?.widgets.kpis?.active_employees ?? tenant?.employee_count ?? 0;
  const pendingInvites = employees.filter((employee) => employee.invitation_status !== "active").length;
  const onboarding = employees.filter((employee) => employee.status === "onboarding").length;
  const departments = new Set(employees.map((employee) => employee.department_name).filter(Boolean)).size;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              {selectedDashboard} dashboard
            </span>
            <span className="text-xs text-muted-foreground">{tenant?.name || "Workspace"}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here is how your organization is doing today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/employees">
            <Button variant="secondary"><Users className="h-4 w-4" /> Manage employees</Button>
          </Link>
          <Link href="/employees/new">
            <Button><UserPlus className="h-4 w-4" /> Add employee</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {availableDashboards.map((view) => (
          <button
            key={view}
            onClick={() => setSelectedDashboard(view)}
            className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              selectedDashboard === view
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {view} dashboard
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-danger/30 bg-danger-soft">
          <p className="text-sm font-medium text-danger">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">Refresh the page after checking that the backend is running.</p>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active employees" value={loading ? "—" : activeEmployees} sub="Company-wide headcount" />
        <StatCard label="Departments" value={loading ? "—" : departments} sub="With people assigned" />
        <StatCard label="Onboarding" value={loading ? "—" : onboarding} sub="New joiners in progress" />
        <StatCard label="Pending invites" value={loading ? "—" : pendingInvites} sub="Need workspace access" />
      </section>

      {dashboard && (
        <section className="grid gap-4 md:grid-cols-2">
          {(["hiring_funnel", "people_cost"] as const).map((widget) => (
            dashboard.widgets[widget]?.status === "not_available" && (
              <Card key={widget} className="border-dashed bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {widget === "hiring_funnel" ? "Hiring funnel" : "People cost"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This widget will appear when the related module is available.
                </p>
                <span className="mt-3 inline-flex rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  Not available
                </span>
              </Card>
            )
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Employees</h2>
              <p className="mt-1 text-sm text-muted-foreground">People currently in your workspace.</p>
            </div>
            <Link href="/employees" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees..." className="pl-9" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No employees found.</div>
            ) : filteredEmployees.map((employee) => (
              <Link key={employee.id} href={`/employees/${employee.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {initials(employee)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{employee.first_name} {employee.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{employee.designation || "No designation"} · {employee.department_name || "No department"}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${statusStyles[employee.status]}`}>
                    {employee.status.replace("_", " ")}
                  </span>
                  <p className={`mt-1 text-[11px] ${invitationStyles[employee.invitation_status]}`}>
                    {employee.invitation_status === "not_invited" ? "Not invited" : employee.invitation_status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">Needs attention</h2>
                <p className="text-sm text-muted-foreground">Keep your workspace moving.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Link href="/employees" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40">
                <span className="flex items-center gap-2 text-sm"><UserPlus className="h-4 w-4 text-primary" /> Pending invitations</span>
                <span className="font-mono text-sm font-semibold">{pendingInvites}</span>
              </Link>
              <Link href="/organization/departments" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40">
                <span className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-primary" /> Review departments</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link href="/audit" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40">
                <span className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /> Open audit log</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/employees/new" className="rounded-lg border border-border p-3 text-sm hover:bg-muted/40"><FilePlus2 className="mb-2 h-4 w-4 text-primary" />Add employee</Link>
              <Link href="/organization/departments" className="rounded-lg border border-border p-3 text-sm hover:bg-muted/40"><Building2 className="mb-2 h-4 w-4 text-primary" />Departments</Link>
              <Link href="/reports" className="rounded-lg border border-border p-3 text-sm hover:bg-muted/40"><BarChart3 className="mb-2 h-4 w-4 text-primary" />Reports</Link>
              <Link href="/settings/general" className="rounded-lg border border-border p-3 text-sm hover:bg-muted/40"><Settings2 className="mb-2 h-4 w-4 text-primary" />Settings</Link>
            </div>
          </Card>
        </div>
      </section>

      <Card className="flex flex-col gap-3 border-primary/20 bg-primary-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">HR operations at a glance</p>
            <p className="text-xs text-muted-foreground">Use the People, Attendance, Leave and Reports sections for detailed workflows.</p>
          </div>
        </div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Open reports <ArrowUpRight className="h-4 w-4" /></Link>
      </Card>
    </div>
  );
}
