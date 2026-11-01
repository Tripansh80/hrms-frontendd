"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/authStore";

type Team = {
  id: string; name: string; code: string | null; department_id: string;
  department_name: string; manager_first_name?: string | null;
  manager_last_name?: string | null; description?: string | null; status: string;
};
type Department = { id: string; name: string };

export default function TeamsPage() {
  const { user } = useAuthStore();
  const canManage = user?.permissions.includes("teams.manage") ?? false;
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState(""); const [description, setDescription] = useState("");

  const load = async () => {
    try {
      const [teamResponse, departmentResponse] = await Promise.all([
        api<{ items: Team[] }>("GET", "/teams"),
        api<{ items: Department[] }>("GET", "/departments"),
      ]);
      setTeams(teamResponse.items); setDepartments(departmentResponse.items);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load teams."); }
  };
  useEffect(() => { load(); }, []);
  const close = () => { setOpen(false); setEditing(null); setName(""); setCode(""); setDepartmentId(""); setDescription(""); };
  const edit = (team: Team) => {
    setEditing(team); setName(team.name); setCode(team.code || "");
    setDepartmentId(team.department_id); setDescription(team.description || ""); setOpen(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    try {
      const payload = { name: name.trim(), code: code.trim() || null, department_id: departmentId, description: description.trim() || null };
      if (editing) await api("PATCH", `/teams/${editing.id}`, payload);
      else await api("POST", "/teams", payload);
      close(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save team."); }
  };
  const archive = async (team: Team) => {
    if (!window.confirm(`Archive ${team.name}?`)) return;
    try { await api("DELETE", `/teams/${team.id}`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not archive team."); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Teams" description="Optional teams within your departments."
        primaryAction={canManage ? <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />New team</Button> : undefined} />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id} className="flex items-start justify-between">
            <div className="flex gap-3"><Users className="mt-1 h-5 w-5 text-[hsl(var(--primary))]" />
              <div><p className="font-medium">{team.name} {team.code && <span className="text-xs text-[hsl(var(--text-muted))]">({team.code})</span>}</p>
                <p className="text-sm text-[hsl(var(--text-muted))]">{team.department_name}</p>
                {team.manager_first_name && <p className="text-xs text-[hsl(var(--text-muted))]">Manager: {team.manager_first_name} {team.manager_last_name}</p>}
              </div>
            </div>
            {canManage && <div className="flex gap-2"><Button variant="ghost" onClick={() => edit(team)}>Edit</Button><Button variant="ghost" onClick={() => archive(team)}>Archive</Button></div>}
          </Card>
        ))}
        {!teams.length && <Card><p className="text-sm text-[hsl(var(--text-muted))]">No teams yet. Teams are optional.</p></Card>}
      </div>
      {open && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"><Card className="w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{editing ? "Edit team" : "Create team"}</h2><button onClick={close}><X className="h-4 w-4" /></button></div>
        <form className="space-y-3" onSubmit={save}><label className="block text-sm">Name<Input value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="block text-sm">Code<Input value={code} onChange={(e) => setCode(e.target.value)} /></label>
          <label className="block text-sm">Department<select className="mt-1 w-full rounded-md border p-2" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required><option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label className="block text-sm">Description<Input value={description} onChange={(e) => setDescription(e.target.value)} /></label><Button type="submit">{editing ? "Save changes" : "Create team"}</Button>
        </form>
      </Card></div>}
    </div>
  );
}
