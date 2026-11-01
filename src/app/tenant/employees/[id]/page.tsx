"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const profilesEnabled = process.env.NEXT_PUBLIC_FEATURE_EMPLOYEE_PROFILES === "true";
const transfersEnabled = process.env.NEXT_PUBLIC_FEATURE_EMPLOYEE_TRANSFERS === "true";

type Profile = {
  id: string; employee_no: string; first_name: string; last_name: string; email: string;
  phone: string | null; designation: string | null; department_name: string | null;
  manager_first_name: string | null; manager_last_name: string | null; status: string;
  employment_type: string; joining_date: string; access: { linked: boolean; membership_status: string | null; roles: { name: string }[] };
  history: { id: string; event_type: string; effective_at: string; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null }[];
};

type EmployeeOption = { id: string; first_name: string; last_name: string };

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [managers, setManagers] = useState<EmployeeOption[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profilesEnabled) return;
    Promise.all([
      api<Profile>("GET", `/employees/${params.id}/profile`),
      api<{ items: EmployeeOption[] }>("GET", "/employees?limit=100"),
    ]).then(([data, employees]) => {
      setProfile(data);
      setManagers(employees.items.filter((item) => item.id !== params.id));
      setDepartmentId((data as Profile & { department_id: string | null }).department_id || "");
      setManagerId((data as Profile & { manager_id: string | null }).manager_id || "");
      setDesignation(data.designation || "");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Could not load profile."));
  }, [params.id]);

  if (!profilesEnabled) return <Card><p className="text-sm text-muted-foreground">Employee profiles are not enabled for this workspace.</p></Card>;
  if (!profile) return <p className="text-sm text-muted-foreground">{message || "Loading profile..."}</p>;

  const saveTransfer = async () => {
    if (!transfersEnabled) { setMessage("Employee transfers are not enabled for this workspace."); return; }
    try {
      const updated = await api<Profile>("POST", `/employees/${params.id}/transfer`, {
        department_id: departmentId || null, manager_id: managerId || null, designation: designation.trim() || null,
      });
      setProfile((current) => current ? { ...current, ...updated } : updated);
      setMessage("Employment details updated.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Could not update employment details.");
    }
  };

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">{profile.first_name} {profile.last_name}</h1><p className="text-sm text-muted-foreground">{profile.employee_no} · {profile.designation || "No designation"}</p></div><Button onClick={() => router.push("/employees")}>Back to people</Button></div>
    {message && <div className="rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-sm">{message}</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <Card><h2 className="font-semibold">Overview</h2><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-muted-foreground">Department</dt><dd>{profile.department_name || "Not assigned"}</dd></div><div><dt className="text-muted-foreground">Reporting manager</dt><dd>{profile.manager_first_name ? `${profile.manager_first_name} ${profile.manager_last_name || ""}` : "Not assigned"}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{profile.status.replace("_", " ")}</dd></div><div><dt className="text-muted-foreground">Joining date</dt><dd>{profile.joining_date}</dd></div></dl></Card>
      <Card><h2 className="font-semibold">Personal information</h2><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-muted-foreground">Email</dt><dd>{profile.email}</dd></div><div><dt className="text-muted-foreground">Phone</dt><dd>{profile.phone || "Not provided"}</dd></div><div><dt className="text-muted-foreground">Employment type</dt><dd className="capitalize">{profile.employment_type.replace("_", " ")}</dd></div></dl></Card>
      <Card><h2 className="font-semibold">Access</h2><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-muted-foreground">Login account</dt><dd>{profile.access.linked ? "Linked" : "Not linked"}</dd></div><div><dt className="text-muted-foreground">Invitation / membership</dt><dd className="capitalize">{profile.access.membership_status || "Not invited"}</dd></div><div><dt className="text-muted-foreground">Assigned roles</dt><dd>{profile.access.roles.map((role) => role.name).join(", ") || "None"}</dd></div></dl></Card>
      <Card><h2 className="font-semibold">History</h2><div className="mt-4 space-y-3">{profile.history.length ? profile.history.map((item) => <div key={item.id} className="border-l-2 border-primary/30 pl-3 text-sm"><p className="font-medium capitalize">{item.event_type.replace("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(item.effective_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">No history recorded.</p>}</div></Card>
    </div>
    {transfersEnabled && <Card><h2 className="font-semibold">Edit employment details</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-sm">Department<input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} placeholder="Department ID" /></label><label className="text-sm">Reporting manager<select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={managerId} onChange={(event) => setManagerId(event.target.value)}><option value="">None</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.first_name} {manager.last_name}</option>)}</select></label><label className="text-sm">Designation<input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={designation} onChange={(event) => setDesignation(event.target.value)} /></label></div><Button className="mt-4" onClick={saveTransfer}>Save employment details</Button></Card>}
  </div>;
}
