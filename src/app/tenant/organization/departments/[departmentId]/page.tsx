"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, History, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, StatCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useParams } from "next/navigation";

type Profile = {
  department: {
    name: string;
    code: string;
    description?: string | null;
    manager_first_name?: string | null;
    manager_last_name?: string | null;
    employee_count: number;
  };
  history: { id: string; action: string; created_at: string }[];
};

export default function DepartmentProfilePage() {
  const params = useParams<{ departmentId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Profile>("GET", `/departments/${params.departmentId}/profile`)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load department profile."));
  }, [params.departmentId]);

  if (error) return <Card className="mx-auto max-w-lg text-center text-sm text-danger">{error}</Card>;
  if (!profile) return <p className="text-sm text-muted-foreground">Loading department profile...</p>;

  const manager = profile.department.manager_first_name
    ? `${profile.department.manager_first_name} ${profile.department.manager_last_name || ""}`
    : "No manager assigned";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/organization/departments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to departments</Link>
      <PageHeader title={profile.department.name} description={`Department profile · ${profile.department.code}`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Employees" value={Number(profile.department.employee_count)} sub="Active department members" />
        <StatCard label="Manager" value={manager} sub="Department manager" />
        <StatCard label="History events" value={profile.history.length} sub="Recent department changes" />
      </div>
      <Card><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Overview</h2></div><p className="mt-3 text-sm text-muted-foreground">{profile.department.description || "No department description has been added."}</p></Card>
      <Card><div className="mb-4 flex items-center gap-2"><History className="h-5 w-5 text-primary" /><h2 className="font-semibold">Department history</h2></div>{profile.history.length === 0 ? <p className="text-sm text-muted-foreground">No history events recorded yet.</p> : <div className="space-y-3">{profile.history.map((event) => <div key={event.id} className="flex items-center gap-3 rounded-lg border border-border p-3"><Users className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium">{event.action.replaceAll(".", " ")}</p><p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p></div></div>)}</div>}</Card>
    </div>
  );
}
