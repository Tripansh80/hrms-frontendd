"use client";

export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  Sparkles,
  LayoutDashboard,
  User,
  Inbox,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Briefcase,
  FileText,
  BookOpen,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  GitBranch,
  Upload,
  UserCog,
  Settings,
  Search,
  LogOut,
  Bell,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  payload_json: Record<string, string> | null;
  created_at: string;
};

export default function TenantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login" || pathname.startsWith("/login");
  const { user, tenant, isLoading, isAuthenticated, logout } = useSession(!isLoginPage);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const loadedNotificationIds = useRef(new Set<string>());

  useEffect(() => {
    if (isLoginPage || !isAuthenticated) return;
    let active = true;
    api<{ items: Notification[] }>("GET", "/notifications?unread_only=true&limit=30")
      .then((response) => {
        if (!active) return;
        setNotifications(response.items);
        response.items.forEach((notification) => loadedNotificationIds.current.add(notification.id));
      })
      .catch(() => {
        // Notification loading must not interrupt workspace navigation.
      });
    return () => {
      active = false;
    };
  }, [isLoginPage, isAuthenticated]);

  const openNotifications = async () => {
    setNotificationsOpen((open) => !open);
    if (notificationsOpen) return;
    try {
      const response = await api<{ items: Notification[] }>("GET", "/notifications?unread_only=true&limit=30");
      const newNotification = response.items.find((notification) => !loadedNotificationIds.current.has(notification.id));
      setNotifications(response.items);
      response.items.forEach((notification) => loadedNotificationIds.current.add(notification.id));
      if (newNotification) setLatestNotification(newNotification);
    } catch {
      // Notification loading must not interrupt workspace navigation.
    }
  };

  const dismissNotification = async (notification: Notification) => {
    setLatestNotification(null);
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    try {
      await api("POST", `/notifications/${notification.id}/read`);
    } catch {
      // Keep the notification removed locally; it can be fetched again from the bell.
    }
  };

  const markNotificationRead = async (notification: Notification) => {
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    try {
      await api("POST", `/notifications/${notification.id}/read`);
    } catch {
      // Keep the notification removed locally; it can be fetched again from the bell.
    }
  };

  // If on login page, render cleanly without dashboard chrome
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="absolute right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </div>
    );
  }

  // If still loading session or not authenticated, show loading screen
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ai to-primary shadow-lg animate-pulse">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Loading workspace...
        </p>
      </div>
    );
  }

  const workspaceName = tenant?.name || "Workspace";
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const isEmployee = !user?.permissions.some((permission) =>
    ["dashboard.admin", "dashboard.hr", "dashboard.manager"].includes(permission)
  );

  const navSections = [
    {
      label: null,
      items: [
        { href: "/", label: "Home", icon: LayoutDashboard },
        { href: "/me", label: "My Space", icon: User },
        { href: "/inbox", label: "Inbox", icon: Inbox },
      ],
    },
    {
      label: "PEOPLE",
      items: [
        { href: "/employees", label: "People", icon: Users },
        { href: "/directory", label: "Directory", icon: Users },
        { href: "/organization/departments", label: "Organization", icon: Building2 },
        { href: "/attendance", label: "Attendance", icon: Clock },
        { href: "/leave", label: "Leave", icon: CalendarDays },
        { href: "/tasks", label: "My tasks", icon: ClipboardList },
        { href: "/recruitment/jobs", label: "Recruitment", icon: Briefcase },
        { href: "/documents", label: "Documents", icon: FileText },
        { href: "/policies", label: "Policies", icon: BookOpen },
      ],
    },
    {
      label: "TASK MANAGEMENT",
      items: [
        { href: "/tasks/manage", label: "Task overview", icon: CheckCircle2 },
      ],
    },
    {
      label: "INSIGHTS",
      items: [
        { href: "/reports", label: "Reports", icon: BarChart3 },
        { href: "/audit", label: "Audit Log", icon: ClipboardList },
      ],
    },
    {
      label: "ADMIN",
      items: [
        { href: "/workflows", label: "Workflows", icon: GitBranch },
        { href: "/imports", label: "Imports", icon: Upload },
        { href: "/settings/members", label: "Users & Roles", icon: UserCog },
        { href: "/settings/general", label: "Settings", icon: Settings },
      ],
    },
  ];
  const employeeOnlyPaths = new Set(["/", "/me", "/leave", "/tasks", "/employees", "/policies"]);
  const navPermissions: Record<string, string> = {
    "/employees": "employees.read",
    "/tasks/manage": "employees.read",
    "/organization/departments": "tenant.read",
    "/attendance": "attendance.read",
    "/leave": "leave.read",
    "/recruitment/jobs": "recruitment.read",
    "/documents": "documents.read",
    "/policies": "policies.read",
    "/reports": "reports.read",
    "/audit": "audit.read",
    "/workflows": "workflows.read",
    "/imports": "imports.read",
    "/settings/members": "users.read",
    "/settings/general": "tenant.update",
  };
  const visibleNavSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const required = navPermissions[item.href];
      if (isEmployee && !employeeOnlyPaths.has(item.href)) return false;
      return !required || user?.permissions.includes(required);
    }),
  })).filter((section) => section.items.length > 0);
  const notificationMessage = latestNotification?.payload_json?.message ||
    (latestNotification?.type === "task.assigned" ? "You have a new task." : "Your leave request has been updated.");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {latestNotification && (
        <div className="fixed right-6 top-20 z-50 w-full max-w-sm rounded-xl border border-primary/30 bg-card p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">New notification</p>
              <p className="mt-1 text-sm text-muted-foreground">{notificationMessage}</p>
            </div>
            <button onClick={() => dismissNotification(latestNotification)} className="text-xs font-medium text-primary hover:underline">Dismiss</button>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        {/* Workspace Brand Header */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">
              {workspaceName}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              AI HRMS
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {visibleNavSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.label && (
                <p className="px-3 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-soft text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Logout at bottom of sidebar */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-surface p-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {userName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              {workspaceName} Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative hidden sm:flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                readOnly
                placeholder="Search anything... ⌘K"
                className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-muted-foreground cursor-pointer focus:outline-none"
              />
            </div>

            {/* Ask AI Pill */}
            <button className="flex items-center gap-1.5 rounded-lg bg-ai-soft px-3 py-1.5 text-xs font-medium text-ai border border-ai/20 hover:bg-ai/15 transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI</span>
            </button>

            {/* Notifications */}
            <button onClick={openNotifications} title={`${notifications.length} unread notifications`} className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}
            </button>
            {notificationsOpen && <div className="absolute right-6 top-14 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="font-semibold">Notifications</p><span className="text-xs text-muted-foreground">{notifications.length} unread</span></div>{notifications.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No unread notifications.</p> : <div className="max-h-80 overflow-y-auto">{notifications.map((notification) => <button key={notification.id} onClick={() => markNotificationRead(notification)} className="w-full border-b border-border px-4 py-3 text-left hover:bg-muted/50"><p className="text-sm font-medium">{notification.payload_json?.message || notification.type.replaceAll(".", " ")}</p><p className="mt-1 text-[11px] text-muted-foreground">Click to mark as read</p></button>)}</div>}</div>}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
