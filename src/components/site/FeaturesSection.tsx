"use client";

import {
  Sparkles,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  GitBranch,
  FileText,
  BarChart3,
  Upload,
  Shield,
  LucideIcon,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "./Animations";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  ai: string;
  iconBg: string;
  iconColor: string;
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "AI HR Assistant",
    desc: "Natural-language HR requests, employee lookup within permissions, leave-balance checks, and pending-approval summaries.",
    ai: "Sensitive actions require confirmation and server-side authorization.",
    iconBg: "bg-ai-soft",
    iconColor: "text-ai",
  },
  {
    icon: Users,
    title: "Employee Management",
    desc: "Employee profiles, departments, locations, managers, reporting hierarchy, employment history, and account invitations.",
    ai: "AI finds authorized employee records and summarizes permitted information.",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    icon: Clock,
    title: "Attendance & Time",
    desc: "Check-in/check-out, work-hour summaries, attendance corrections, and absence tracking based on configured schedules.",
    ai: "AI summarizes attendance patterns and surfaces records needing review.",
    iconBg: "bg-info-soft",
    iconColor: "text-info",
  },
  {
    icon: CalendarDays,
    title: "Leave Management",
    desc: "Leave types, balances, requests, approvals, cancellations, and holiday-aware validation.",
    ai: "AI checks balances, explains next steps, and surfaces pending approvals.",
    iconBg: "bg-success-soft",
    iconColor: "text-success",
  },
  {
    icon: Briefcase,
    title: "Recruitment & Hiring",
    desc: "Job openings, candidates, applications, interview stages, feedback, offers, and conversion of a hire into an employee.",
    ai: "AI helps organize candidate information and summarize feedback.",
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  {
    icon: GitBranch,
    title: "Approvals & Workflows",
    desc: "Configurable approval steps, conditions, deadlines, notifications, escalations, and task tracking.",
    ai: "AI helps understand pending tasks and trigger supported workflow actions.",
    iconBg: "bg-ai-soft",
    iconColor: "text-ai",
  },
  {
    icon: FileText,
    title: "Documents & Policies",
    desc: "Uploads, verification, policy versions, acknowledgements, and expiry reminders.",
    ai: "AI-powered document search planned as a future enhancement.",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Reports & Insights",
    desc: "Headcount, attendance, leave, and attrition reporting with CSV export.",
    ai: "AI provides plain-language summaries grounded in underlying data.",
    iconBg: "bg-info-soft",
    iconColor: "text-info",
  },
  {
    icon: Upload,
    title: "Bulk Import & Setup",
    desc: "CSV/XLSX imports with progress indicators and row-level errors, plus departments, locations, schedules, and holidays.",
    ai: "AI may help explain import errors — planned enhancement.",
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  {
    icon: Shield,
    title: "Security & Audit",
    desc: "Role-based access control, tenant isolation, audit trails, and controlled access to sensitive employee information.",
    ai: "AI operates within the same authorization boundaries as the user.",
    iconBg: "bg-success-soft",
    iconColor: "text-success",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-t border-border bg-surface"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        <FadeUp>
          <div className="mb-4 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
              One Workspace. Every HR Workflow.
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The essentials of HR,{" "}
            <span className="bg-gradient-to-r from-ai to-primary bg-clip-text text-transparent">
              with AI built in
            </span>
            .
          </h2>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p className="mx-auto mb-14 max-w-xl text-center text-base text-muted-foreground">
            Every module works together in one platform, with an AI assistant
            that understands your permissions and policies.
          </p>
        </FadeUp>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group h-full rounded-xl border border-border bg-background p-5 transition-all hover:border-border-strong hover:shadow-md">
                <div
                  className={`mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg}`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.iconColor}`}
                  />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
                <div className="flex items-start gap-1.5">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai" />
                  <p className="text-xs leading-relaxed text-subtle">
                    {feature.ai}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
