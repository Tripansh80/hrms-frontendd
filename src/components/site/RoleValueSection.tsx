"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  User,
  FileText,
  CalendarDays,
  BarChart3,
  GitBranch,
  Clock,
  Briefcase,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { FadeUp, FadeIn } from "./Animations";

const roles = [
  {
    id: "hr",
    label: "For HR Teams",
    icon: Users,
    headline: "Your complete HR command center",
    items: [
      { icon: Users, text: "Manage employee records, departments, and hierarchy" },
      { icon: Briefcase, text: "Run recruitment pipelines from opening to hire" },
      { icon: FileText, text: "Organize documents, policies, and acknowledgements" },
      { icon: BarChart3, text: "Generate reports on headcount, attendance, and attrition" },
      { icon: GitBranch, text: "Configure approval workflows and notifications" },
      { icon: Shield, text: "Full audit trail of every action" },
    ],
  },
  {
    id: "manager",
    label: "For Managers",
    icon: UserCheck,
    headline: "Stay on top of your team",
    items: [
      { icon: CalendarDays, text: "Review and approve leave requests" },
      { icon: CheckCircle2, text: "See all pending approvals in one place" },
      { icon: Clock, text: "Understand team attendance within your access" },
      { icon: Users, text: "View team members and reporting structure" },
      { icon: BarChart3, text: "Access team-level reports and summaries" },
      { icon: GitBranch, text: "Track workflow tasks and escalations" },
    ],
  },
  {
    id: "employee",
    label: "For Employees",
    icon: User,
    headline: "Self-service HR made simple",
    items: [
      { icon: CalendarDays, text: "Check leave balances and request time off" },
      { icon: Clock, text: "Check in/out where attendance tracking is enabled" },
      { icon: FileText, text: "Find relevant HR policies and documents" },
      { icon: Users, text: "View your profile and employment details" },
      { icon: CheckCircle2, text: "Track your requests and approval status" },
      { icon: Shield, text: "Access is scoped to your permissions" },
    ],
  },
];

export function RoleValueSection() {
  const [activeRole, setActiveRole] = useState("hr");
  const active = roles.find((r) => r.id === activeRole) || roles[0];

  return (
    <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        <FadeUp>
          <div className="mb-4 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
              Built for Every Role
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-[hsl(var(--text))] sm:text-4xl">
            One platform,{" "}
            <span className="text-[hsl(var(--primary))]">
              tailored for you
            </span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.16}>
          {/* Tab selector */}
          <div className="mx-auto mb-10 flex max-w-md justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeRole === role.id
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-fg))] shadow-sm"
                    : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
                }`}
              >
                <role.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <FadeIn key={active.id}>
            <div className="mx-auto max-w-2xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8">
              <h3 className="mb-6 text-xl font-semibold text-[hsl(var(--text))]">
                {active.headline}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {active.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[hsl(var(--surface-2))]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary-soft))]">
                      <item.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <p className="pt-1 text-sm text-[hsl(var(--text-muted))]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-[hsl(var(--text-subtle))]">
                Available actions depend on permissions and enabled modules.
              </p>
            </div>
          </FadeIn>
        </FadeUp>
      </div>
    </section>
  );
}
