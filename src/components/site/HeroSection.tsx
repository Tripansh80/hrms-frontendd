"use client";

import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { FadeUp, ScaleIn } from "./Animations";

export function HeroSection() {
  return (
    <section id="platform" className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[hsl(var(--ai-soft))] via-transparent to-transparent opacity-50" />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Copy */}
          <div>
            <FadeUp>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ai)_/_0.2)] bg-[hsl(var(--ai-soft))] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ai))]">
                <Sparkles className="h-3.5 w-3.5" />
                AI-First Human Resource Management
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-[hsl(var(--text))] sm:text-5xl lg:text-[56px]">
                Meet your new{" "}
                <span className="bg-gradient-to-r from-[hsl(var(--ai))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
                  AI HRMS
                </span>
                .
              </h1>
            </FadeUp>

            <FadeUp delay={0.16}>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-[hsl(var(--text-muted))]">
                From hiring and attendance to leave, documents, and
                approvals—manage your people operations with an AI assistant
                that helps your team get work done, securely.
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-[hsl(var(--primary-fg))] shadow-sm transition-all hover:bg-[hsl(var(--primary-hover))] hover:shadow-lg"
                >
                  Explore AI HRMS
                  <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  href="#ai-assistant"
                  className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-3 text-sm font-medium text-[hsl(var(--text))] transition-all hover:bg-[hsl(var(--surface-2))]"
                >
                  See how it works
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.32}>
              <p className="mt-8 text-xs text-[hsl(var(--text-subtle))]">
                Built for HR teams, managers, and employees · Role-aware access
                · Human-confirmed sensitive actions
              </p>
            </FadeUp>
          </div>

          {/* Product preview */}
          <ScaleIn delay={0.2}>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1 shadow-2xl shadow-black/5">
              <div className="rounded-xl bg-[hsl(var(--bg))] p-4">
                {/* Mini dashboard top bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--primary))]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--text))]">
                      HR Dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
                    <span className="text-[10px] text-[hsl(var(--text-muted))]">
                      Online
                    </span>
                  </div>
                </div>

                {/* Mini stat cards */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-2.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-[hsl(var(--text-subtle))]" />
                      <span className="text-[10px] text-[hsl(var(--text-muted))]">Employees</span>
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--text))]">248</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-2.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-[hsl(var(--text-subtle))]" />
                      <span className="text-[10px] text-[hsl(var(--text-muted))]">On Leave</span>
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--text))]">12</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-2.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[hsl(var(--text-subtle))]" />
                      <span className="text-[10px] text-[hsl(var(--text-muted))]">Pending</span>
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--text))]">7</p>
                  </div>
                </div>

                {/* Activity + AI panel */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Recent activity */}
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                      Recent Activity
                    </p>
                    <div className="mb-1.5 flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--success))]" />
                      <div>
                        <p className="text-[10px] font-medium text-[hsl(var(--text))]">Leave approved</p>
                        <p className="text-[9px] text-[hsl(var(--text-subtle))]">Priya K.</p>
                      </div>
                    </div>
                    <div className="mb-1.5 flex items-start gap-2">
                      <Users className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--primary))]" />
                      <div>
                        <p className="text-[10px] font-medium text-[hsl(var(--text))]">New hire started</p>
                        <p className="text-[9px] text-[hsl(var(--text-subtle))]">Rahul M.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(var(--ai))]" />
                      <div>
                        <p className="text-[10px] font-medium text-[hsl(var(--text))]">
                          AI summary ready
                          <span className="ml-1 rounded bg-[hsl(var(--ai-soft))] px-1 py-px text-[8px] text-[hsl(var(--ai))]">AI</span>
                        </p>
                        <p className="text-[9px] text-[hsl(var(--text-subtle))]">Attendance</p>
                      </div>
                    </div>
                  </div>

                  {/* AI assistant panel */}
                  <div className="rounded-lg border border-[hsl(var(--ai)_/_0.2)] bg-gradient-to-b from-[hsl(var(--ai-soft))] to-[hsl(var(--surface))] p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[hsl(var(--ai))]" />
                      <p className="text-[10px] font-semibold text-[hsl(var(--ai))]">
                        AI Assistant
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        "Show pending leave approvals",
                        "Remaining leave balance?",
                        "Start onboarding workflow",
                        "Summarize attendance",
                      ].map((prompt) => (
                        <div
                          key={prompt}
                          className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1.5"
                        >
                          <MessageSquare className="h-2.5 w-2.5 shrink-0 text-[hsl(var(--ai))]" />
                          <span className="text-[9px] text-[hsl(var(--text-muted))]">
                            {prompt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
