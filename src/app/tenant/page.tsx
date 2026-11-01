"use client";

import { useAuthStore } from "@/store/authStore";
import {
  Sparkles,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const [approvedList, setApprovedList] = useState<string[]>([]);
  const [rejectedList, setRejectedList] = useState<string[]>([]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";
  const workspaceName = tenant?.name || "Company";
  const primaryRole = user?.roles?.[0] || "Employee";
  const isOwner = user?.roles?.some((role) => role.toLowerCase().includes("owner")) ?? false;
  const isPeopleManager = user?.roles?.some((role) => role.toLowerCase().includes("people manager")) ?? false;
  const isDepartmentManager = user?.roles?.some((role) => role.toLowerCase().includes("department manager")) ?? false;
  const isEmployee = user?.roles?.includes("Employee") && !isOwner && !isPeopleManager && !isDepartmentManager;

  if (isEmployee) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName} 👋</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your leave, policies, tasks, and department colleagues.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/leave" className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"><Calendar className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">My leave</p><p className="mt-1 text-sm text-muted-foreground">Request leave and view balances.</p></Link>
          <Link href="/tasks" className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">My tasks</p><p className="mt-1 text-sm text-muted-foreground">View manager-assigned work.</p></Link>
          <Link href="/policies" className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"><Briefcase className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Policies</p><p className="mt-1 text-sm text-muted-foreground">Read published company policies.</p></Link>
        </div>
      </div>
    );
  }

  const handleApprove = (name: string) => {
    setApprovedList((prev) => [...prev, name]);
  };

  const handleReject = (name: string) => {
    setRejectedList((prev) => [...prev, name]);
  };

  const approvals = [
    { name: "Rahul Mehta", type: "Annual Leave", dates: "Nov 12–14", urgent: false },
    { name: "Priya Singh", type: "WFH Request", dates: "Oct 25", urgent: true },
    { name: "Amit Kumar", type: "Attendance Correction", dates: "Oct 18", urgent: false },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {firstName} 👋
            </h1>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              {workspaceName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" "}· Here is what is happening across your workspace today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>Role: <strong className="text-foreground">{primaryRole}</strong></span>
          </div>

          {(isOwner || isPeopleManager || isDepartmentManager) && (
            <div className="rounded-xl border border-primary/20 bg-primary-soft p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isOwner ? "Company owner workspace" : isPeopleManager ? "People manager workspace" : "Department manager workspace"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOwner ? "Manage the complete organization, departments, people, roles, and HR operations." : isPeopleManager ? "Manage people and employment details within your department." : "Review your department and manage permitted employee information."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(isOwner || isPeopleManager) && <Link href="/employees" className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Manage people</Link>}
                  <Link href="/organization/departments" className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">View organization</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Employees",
            value: tenant?.employee_count || 142,
            sub: "+4 this month",
            icon: Users,
            color: "text-primary",
            bg: "bg-primary-soft",
          },
          {
            label: "On Leave Today",
            value: "7",
            sub: "3 pending requests",
            icon: Calendar,
            color: "text-warning",
            bg: "bg-warning-soft",
          },
          {
            label: "Present Today",
            value: "128",
            sub: "90.1% attendance",
            icon: Clock,
            color: "text-success",
            bg: "bg-success-soft",
          },
          {
            label: "Open Positions",
            value: "5",
            sub: "12 applications",
            icon: Briefcase,
            color: "text-ai",
            bg: "bg-ai-soft",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column layout: AI Assistant Suggestions + Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Assistant Suggestions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai-soft">
              <Sparkles className="h-4 w-4 text-ai" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                AI Assistant Quick Actions
              </h2>
              <p className="text-xs text-muted-foreground">
                Ask in plain English or trigger routine actions
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              "How many leave days do I have left this year?",
              "Show me all requests waiting for my approval",
              "Summarize today's team attendance and late arrivals",
              "Start an onboarding workflow for a new engineering hire",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => alert(`AI command: "${prompt}" (Demo preview)`)}
                className="group flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-xs font-medium text-foreground transition-all hover:border-ai/40 hover:bg-ai-soft/30 hover:text-ai"
              >
                <span>{prompt}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Waiting on Your Approval
                </h2>
                <p className="text-xs text-muted-foreground">
                  Human-in-the-loop review required
                </p>
              </div>
            </div>
            <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
              {approvals.filter((a) => !approvedList.includes(a.name) && !rejectedList.includes(a.name)).length} pending
            </span>
          </div>

          <div className="divide-y divide-border">
            {approvals.map((item) => {
              const isApproved = approvedList.includes(item.name);
              const isRejected = rejectedList.includes(item.name);

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {item.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.urgent && (
                          <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.type} · {item.dates}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                        <Check className="h-3.5 w-3.5" /> Approved
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                        <X className="h-3.5 w-3.5" /> Declined
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(item.name)}
                          className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.name)}
                          className="flex items-center justify-center rounded-lg border border-border bg-surface p-1.5 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
