"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Building2, HelpCircle } from "lucide-react";

export default function FindWorkspacePage() {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // If user pasted a full domain/URL, extract the subdomain
    let cleaned = raw.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\//, "");
    cleaned = cleaned.replace(/\/.*$/, "");
    if (cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    }
    // Only allow letters, numbers, and hyphens
    cleaned = cleaned.replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase().replace(/^-+|-+$/g, "");
    
    if (!cleanSlug) {
      setError("Please enter your workspace slug");
      return;
    }

    if (cleanSlug.length < 2) {
      setError("Workspace slug must be at least 2 characters");
      return;
    }

    setLoading(true);

    try {
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";
      const port = window.location.port ? `:${window.location.port}` : "";
      const protocol = window.location.protocol || "http:";

      const targetUrl = `${protocol}//${cleanSlug}.${baseDomain}${port}/login`;
      window.location.href = targetUrl;
    } catch (err) {
      setLoading(false);
      setError("Could not redirect to workspace. Please check your slug.");
    }
  };

  const baseDomain = typeof window !== "undefined"
    ? `${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost"}${window.location.port ? `:${window.location.port}` : ""}`
    : "localhost:3000";

  return (
    <main className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        {/* Brand icon & header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ai to-primary shadow-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Find your workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your company&apos;s workspace slug to access your HR portal.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="slug-input"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
            >
              Workspace address
            </label>
            <div className="relative flex items-center rounded-lg border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <input
                id="slug-input"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="company-name"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-transparent px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-subtle focus:outline-none"
              />
              <span className="shrink-0 border-l border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground select-none font-mono">
                .{baseDomain}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <p className="mt-2 text-xs font-medium text-danger animate-in fade-in">
                {error}
              </p>
            )}

            {/* Live URL Preview */}
            {slug && !error && (
              <p className="mt-2 text-xs text-muted-foreground">
                Redirects to:{" "}
                <span className="font-mono text-primary font-medium">
                  {slug}.{baseDomain}/login
                </span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !slug.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <span>Redirecting...</span>
            ) : (
              <>
                <span>Continue to workspace</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Help footer */}
        <div className="mt-8 border-t border-border pt-5">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            <p>
              Your workspace slug was chosen when your company signed up (e.g.{" "}
              <span className="font-mono text-foreground font-medium">acme</span> for{" "}
              <span className="font-mono text-foreground">acme.{baseDomain}</span>). Check your welcome email if you&apos;re unsure.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-border/50">
            <a
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to home
            </a>
            <a
              href="/signup"
              className="font-medium text-primary transition-colors hover:underline"
            >
              Create new workspace →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
