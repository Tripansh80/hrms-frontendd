import { Sparkles } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-[hsl(var(--text))]">
                PeoplePilot AI
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--text-muted))]">
              AI-first human resource management. Manage people, attendance,
              leave, hiring, documents, and approvals from one secure workspace.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Features", href: "#features" },
                { label: "AI Assistant", href: "#ai-assistant" },
                { label: "Security", href: "#security" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[hsl(var(--text-subtle))] transition-colors hover:text-[hsl(var(--text))]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get started */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
              Get Started
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Sign up", href: "/signup" },
                { label: "Log in", href: "/find-workspace" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[hsl(var(--text-subtle))] transition-colors hover:text-[hsl(var(--text))]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[hsl(var(--border))] pt-6">
          <p className="text-center text-xs text-[hsl(var(--text-subtle))]">
            © {year} PeoplePilot AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
