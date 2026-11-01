"use client";

import {
  MessageSquare,
  Brain,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import { StaggerContainer, StaggerItem } from "./Animations";

const steps = [
  {
    icon: MessageSquare,
    title: "Ask",
    desc: "Describe the HR task in natural language.",
    step: 1,
  },
  {
    icon: Brain,
    title: "Understand",
    desc: "The assistant interprets the request and checks user context.",
    step: 2,
  },
  {
    icon: ShieldCheck,
    title: "Confirm",
    desc: "Review sensitive changes before they happen.",
    step: 3,
  },
  {
    icon: ClipboardCheck,
    title: "Track",
    desc: "Authorized actions are processed and recorded.",
    step: 4,
  },
];

export function AIWorkflowStrip() {
  return (
    <section className="border-t border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--ai-soft))] via-[hsl(var(--bg))] to-[hsl(var(--primary-soft))]">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-24">
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ai))]">
            AI in Every Workflow
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[hsl(var(--text))] sm:text-3xl">
            How AI complements your HR processes
          </h2>
        </div>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StaggerItem key={step.title}>
              <div className="relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--ai-soft))] to-[hsl(var(--primary-soft))]">
                  <step.icon className="h-6 w-6 text-[hsl(var(--ai))]" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--ai))] px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--text))]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[hsl(var(--text-muted))]">
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
