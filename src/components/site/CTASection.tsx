"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { FadeUp } from "./Animations";

export function CTASection() {
  return (
    <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28">
        <FadeUp>
          <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--surface))] via-[hsl(var(--ai-soft))] to-[hsl(var(--primary-soft))] p-10 text-center md:p-16">
            {/* Subtle decorative elements */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--ai))]/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[hsl(var(--primary))]/5 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--ai))] to-[hsl(var(--primary))]">
                <Sparkles className="h-6 w-6 text-white" />
              </div>

              <h2 className="mb-4 text-3xl font-bold tracking-tight text-[hsl(var(--text))] sm:text-4xl">
                Ready to make HR feel effortless?
              </h2>

              <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-[hsl(var(--text-muted))]">
                Bring people, processes, and AI assistance into one secure HR
                workspace.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-7 py-3 text-sm font-medium text-[hsl(var(--primary-fg))] transition-all hover:bg-[hsl(var(--primary-hover))] hover:shadow-lg"
                >
                  Get started
                  <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-7 py-3 text-sm font-medium text-[hsl(var(--text))] transition-all hover:bg-[hsl(var(--surface-2))]"
                >
                  Explore the features
                </a>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
