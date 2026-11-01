"use client";

import { Bell, Sparkles, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";

export default function TopBar() {
  const { setAiPanelOpen } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6">
      {/* Left: breadcrumbs placeholder */}
      <div className="text-sm text-[hsl(var(--text-muted))]">Home</div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1.5 text-sm text-[hsl(var(--text-muted))] hover:border-[hsl(var(--border-strong))] transition-colors">
          <Search className="h-4 w-4" />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden sm:block rounded border border-[hsl(var(--border))] px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>

        {/* Ask AI */}
        <button
          onClick={() => setAiPanelOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--ai-soft))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--ai))] hover:opacity-90 transition-opacity"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:block">Ask AI</span>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar */}
        {user && (
          <Avatar name={user.name} id={user.id} size="sm" />
        )}
      </div>
    </header>
  );
}
