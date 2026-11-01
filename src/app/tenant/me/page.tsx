"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Building2, CalendarDays, Mail, Settings, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api";

type ProfileResponse = {
  full_name?: string | null;
  employee_id?: string | null;
  designation?: string | null;
};

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function MySpacePage() {
  const { user, tenant, isLoading } = useSession();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    if (!user) return;
    api<ProfileResponse>("GET", "/auth/me").then(setProfile).catch(() => {
      // The locally stored session still gives the page useful profile data.
    });
  }, [user]);

  if (isLoading || !user) {
    return <div className="text-sm text-muted-foreground">Loading your profile...</div>;
  }

  const displayName = profile?.full_name || user.name || user.email.split("@")[0];
  const employeeId = profile?.employee_id ?? user.employee_id;
  const designation = profile?.designation ?? user.designation;
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const roles = user.roles.length ? user.roles : ["Member"];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Space"
        description="Your profile, access, and workspace details."
        primaryAction={
          <Link href="/preferences" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <Settings className="h-4 w-4" />
            Preferences
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="h-24 bg-gradient-to-r from-primary to-ai" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-sm">{initials}</div>
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary"><BriefcaseBusiness className="h-4 w-4" />{designation || "Designation not set"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border pt-2">
              <DetailRow icon={Mail} label="Email address" value={user.email} />
              <DetailRow icon={UserRound} label="Employee ID" value={employeeId || "Not linked to an employee record"} />
              <DetailRow icon={BriefcaseBusiness} label="Designation" value={designation || "Not set"} />
              <DetailRow icon={CalendarDays} label="Account status" value="Active" />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="font-semibold text-foreground">Your access</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Roles assigned in this workspace.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => <span key={role} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{role}</span>)}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-semibold text-foreground">Workspace</h2></div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{tenant?.name || "Workspace"}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Workspace URL</span><span className="font-mono text-xs text-foreground">{tenant?.slug || "workspace"}.localhost</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Plan</span><span className="capitalize font-medium text-foreground">{tenant?.plan || "Growth"}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
