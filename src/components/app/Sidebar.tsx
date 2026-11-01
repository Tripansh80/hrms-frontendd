"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Inbox, Users, Building2, Clock, Calendar,
  Briefcase, FileText, BookOpen, GitBranch, Upload,
  BarChart2, ClipboardList, Workflow, Settings, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { usePermissions } from "@/hooks/usePermissions";

const navSections = [
  {
    label: null,
    items: [
      { href: "/", label: "Home", icon: Home, perm: null },
      { href: "/me", label: "My space", icon: Users, perm: null },
      { href: "/inbox", label: "Inbox", icon: Inbox, perm: null, badge: true },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { href: "/employees", label: "People", icon: Users, perm: "employees.read" },
      { href: "/organization/departments", label: "Organization", icon: Building2, perm: "tenant.read" },
      ...(process.env.NEXT_PUBLIC_FEATURE_TEAMS === "true" ? [{ href: "/organization/teams", label: "Teams", icon: Users, perm: "teams.read" }] : []),
      { href: "/attendance", label: "Attendance", icon: Clock, perm: "attendance.read" },
      { href: "/leave", label: "Leave", icon: Calendar, perm: "leave.read" },
      { href: "/recruitment/jobs", label: "Recruitment", icon: Briefcase, perm: "recruitment.read" },
      { href: "/documents", label: "Documents", icon: FileText, perm: "documents.read" },
      { href: "/policies", label: "Policies", icon: BookOpen, perm: "policies.read" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart2, perm: "reports.read" },
      { href: "/audit", label: "Audit log", icon: ClipboardList, perm: "audit.read" },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/workflows", label: "Workflows", icon: Workflow, perm: "workflows.read" },
      { href: "/imports", label: "Imports", icon: Upload, perm: "imports.read", feature: "employeeImport" },
      { href: "/settings/members", label: "Users & roles", icon: Users, perm: "users.read" },
      { href: "/settings/general", label: "Settings", icon: Settings, perm: "tenant.update" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { can } = usePermissions();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-[248px]"
      )}
    >
      {/* Logo / workspace name */}
      <div className="flex h-14 items-center gap-3 border-b border-[hsl(var(--border))] px-4">
        <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary))]" />
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm">HRMS</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {navSections.map((section) => (
          <div key={section.label ?? "root"}>
            {section.label && !sidebarCollapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-subtle))]">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items
                .filter((item) => (!item.perm || can(item.perm)) &&
                  (!("feature" in item) || process.env.NEXT_PUBLIC_FEATURE_EMPLOYEE_IMPORT === "true"))
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]"
                            : "text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm"
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
