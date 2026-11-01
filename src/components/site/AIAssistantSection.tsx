"use client";

import { Sparkles, User, ShieldCheck } from "lucide-react";
import { FadeUp, ScaleIn } from "./Animations";

const chatMessages = [
  {
    role: "user" as const,
    text: "Show leave requests waiting for my approval.",
  },
  {
    role: "ai" as const,
    text: "You have 4 requests awaiting review. Here's a summary:",
  },
  {
    role: "user" as const,
    text: "Approve Priya's request for 12–13 November.",
  },
  {
    role: "ai" as const,
    text: "I found the request. Confirm approval for Priya K. — 12–13 November (2 days casual leave)?",
    action: true,
  },
];

export function AIAssistantSection() {
  return (
    <section
      id="ai-assistant"
      className="border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Copy */}
          <div>
            <FadeUp>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ai))]/20 bg-[hsl(var(--ai-soft))] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ai))]">
                <Sparkles className="h-3.5 w-3.5" />
                Meet Your AI HR Assistant
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-[hsl(var(--text))] sm:text-4xl">
                Ask. Review. Approve.{" "}
                <span className="text-[hsl(var(--primary))]">Done.</span>
              </h2>
            </FadeUp>

            <FadeUp delay={0.16}>
              <p className="mb-6 max-w-md text-base leading-relaxed text-[hsl(var(--text-muted))]">
                Use natural language to navigate HR tasks. The assistant
                understands the request, checks permissions and policy rules,
                and asks for confirmation before sensitive actions.
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--ai))]/15 bg-[hsl(var(--ai-soft))] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--ai))]" />
                <p className="text-sm leading-relaxed text-[hsl(var(--text-muted))]">
                  <span className="font-medium text-[hsl(var(--text))]">
                    Sensitive actions require confirmation.
                  </span>{" "}
                  Every permitted action is validated and recorded.
                </p>
              </div>
            </FadeUp>
          </div>

          {/* Chat demo */}
          <ScaleIn delay={0.12}>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-xl">
              {/* Chat header */}
              <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-5 py-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--ai))] to-[hsl(var(--primary))]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--text))]">
                    AI HR Assistant
                  </p>
                  <p className="text-[10px] text-[hsl(var(--text-subtle))]">
                    Demo conversation
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-3 px-5 py-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
                          ? "bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]"
                          : "bg-[hsl(var(--ai-soft))] text-[hsl(var(--ai))]"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                        msg.role === "user"
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-fg))]"
                          : "border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--text))]"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {msg.action && (
                        <div className="mt-2 flex gap-2">
                          <span className="cursor-default rounded-md bg-[hsl(var(--success))] px-3 py-1 text-xs font-medium text-white">
                            Confirm
                          </span>
                          <span className="cursor-default rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1 text-xs font-medium text-[hsl(var(--text-muted))]">
                            Cancel
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo label */}
              <div className="border-t border-[hsl(var(--border))] px-5 py-3">
                <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--text-subtle))]" />
                  <span className="text-xs text-[hsl(var(--text-subtle))]">
                    This is an illustrative demo — no real actions are performed
                  </span>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
