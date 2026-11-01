"use client";

import {
  ShieldCheck,
  UserCheck,
  ClipboardCheck,
  Building2,
  FileCheck,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "./Animations";

const trustPrinciples = [
  {
    icon: UserCheck,
    title: "Permission-aware",
    desc: "The assistant only accesses information and actions allowed for the signed-in user.",
  },
  {
    icon: ShieldCheck,
    title: "Human confirmation",
    desc: "Confirm sensitive actions such as approving leave or creating employee records before they execute.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditable workflows",
    desc: "Keep a trace of permitted actions and approvals with a full audit trail.",
  },
  {
    icon: Building2,
    title: "Tenant separation",
    desc: "Each organization's data is completely isolated with strict tenant boundaries.",
  },
  {
    icon: FileCheck,
    title: "Policy validation",
    desc: "Requests are validated on the server. AI output is never treated as authorization.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        <FadeUp>
          <div className="mb-4 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
              Security & Trust
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[hsl(var(--text))] sm:text-4xl">
            Helpful AI.{" "}
            <span className="text-[hsl(var(--success))]">
              Clear boundaries.
            </span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p className="mx-auto mb-14 max-w-xl text-center text-base text-[hsl(var(--text-muted))]">
            AI makes HR faster — but never at the cost of security, privacy, or
            control. Every action stays within your organization's policies.
          </p>
        </FadeUp>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustPrinciples.map((principle) => (
            <StaggerItem key={principle.title}>
              <div className="flex h-full items-start gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--success-soft))]">
                  <principle.icon className="h-5 w-5 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <h3 className="mb-1.5 text-base font-semibold text-[hsl(var(--text))]">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--text-muted))]">
                    {principle.desc}
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
