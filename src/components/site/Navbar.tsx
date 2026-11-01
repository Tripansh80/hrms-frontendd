"use client";

import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#ai-assistant", label: "AI HR Assistant", ai: true },
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[hsl(var(--text))]">
            PeoplePilot AI
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
                link.ai
                  ? "font-medium text-[hsl(var(--ai))] hover:bg-[hsl(var(--ai-soft))]"
                  : "text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]"
              }`}
            >
              {link.ai && <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />}
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <a
            href="/find-workspace"
            className="rounded-lg px-4 py-2 text-sm font-medium text-[hsl(var(--text-muted))] transition-colors hover:text-[hsl(var(--text))]"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-lg bg-[hsl(var(--primary))] px-5 py-2 text-sm font-medium text-[hsl(var(--primary-fg))] transition-all hover:bg-[hsl(var(--primary-hover))]"
          >
            Get started
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-muted))]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  link.ai
                    ? "font-medium text-[hsl(var(--ai))]"
                    : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
                }`}
              >
                {link.ai && (
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                )}
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="/find-workspace"
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-center text-sm font-medium text-[hsl(var(--text))]"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-center text-sm font-medium text-[hsl(var(--primary-fg))]"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
