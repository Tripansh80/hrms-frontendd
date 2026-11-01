"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, KeyRound, Plus, Save, ShieldAlert, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type Role = { id: string; name: string; description: string; is_system: boolean; data_scope: string; permissions: string[] };
type Permission = { id: string; code: string; description: string | null };

export default function RolesPage() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [scope, setScope] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRead = user?.permissions.includes("roles.read") ?? false;
  const canManage = user?.permissions.includes("roles.manage") ?? false;
  const selectedRole = roles.find((role) => role.id === selectedId) || null;
  const groupedPermissions = useMemo(() => permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const group = permission.code.split(".")[0];
    (groups[group] ||= []).push(permission);
    return groups;
  }, {}), [permissions]);

  useEffect(() => {
    if (!canRead) return;
    Promise.all([api<{ items: Role[] }>("GET", "/roles"), api<{ items: Permission[] }>("GET", "/permissions")])
      .then(([roleResponse, permissionResponse]) => {
        setRoles(roleResponse.items);
        setPermissions(permissionResponse.items);
        setSelectedId(roleResponse.items[0]?.id || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load access controls."))
      .finally(() => setLoading(false));
  }, [canRead]);

  useEffect(() => {
    setSelectedPermissions(selectedRole?.permissions || []);
  }, [selectedRole]);

  const createRole = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const role = await api<Role>("POST", "/roles", { name: newRoleName, description: newRoleDescription, data_scope: scope });
      setRoles((current) => [...current, { ...role, permissions: [] }]);
      setSelectedId(role.id);
      setShowCreate(false);
      setNewRoleName("");
      setNewRoleDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the role.");
    } finally { setSaving(false); }
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const result = await api<{ permissions: string[] }>("PUT", `/roles/${selectedRole.id}/permissions`, { permissions: selectedPermissions });
      setRoles((current) => current.map((role) => role.id === selectedRole.id ? { ...role, permissions: result.permissions } : role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update permissions.");
    } finally { setSaving(false); }
  };

  if (user && !canRead) return <Card className="mx-auto max-w-lg text-center"><ShieldAlert className="mx-auto h-9 w-9 text-danger" /><h1 className="mt-3 text-lg font-semibold">Role access required</h1><p className="mt-1 text-sm text-muted-foreground">Your role needs <code>roles.read</code> to view access controls.</p></Card>;
  if (loading) return <p className="text-sm text-muted-foreground">Loading roles and permissions...</p>;

  return <div className="mx-auto max-w-6xl"><PageHeader title="Roles & permissions" description="Control what people can view and manage in this workspace." primaryAction={canManage ? <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Create role</Button> : undefined} />{error && <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}<div className="grid gap-6 lg:grid-cols-[300px_1fr]"><Card className="p-2"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</p>{roles.map((role) => <button key={role.id} onClick={() => setSelectedId(role.id)} className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${selectedId === role.id ? "bg-primary-soft text-primary" : "hover:bg-muted"}`}><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span className="font-medium">{role.name}</span>{role.is_system && <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">SYSTEM</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{role.permissions.length} permissions · {role.data_scope} scope</p></button>)}</Card><Card>{selectedRole ? <><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">{selectedRole.name}</h2></div><p className="mt-1 text-sm text-muted-foreground">{selectedRole.description || "No description"} · {selectedRole.data_scope} data scope</p></div>{selectedRole.is_system ? <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">System roles are read-only</span> : canManage ? <Button onClick={savePermissions} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save permissions"}</Button> : null}</div><p className="mt-5 text-sm text-muted-foreground">Select the permissions granted by this role.</p><div className="mt-5 space-y-5">{Object.entries(groupedPermissions).map(([group, entries]) => <div key={group}><h3 className="mb-2 capitalize text-sm font-semibold">{group}</h3><div className="grid gap-2 sm:grid-cols-2">{entries.map((permission) => { const selected = selectedPermissions.includes(permission.code); return <button key={permission.id} type="button" disabled={!canManage || selectedRole.is_system} onClick={() => setSelectedPermissions((current) => selected ? current.filter((code) => code !== permission.code) : [...current, permission.code])} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-default ${selected ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"}`}><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-3 w-3" />}</span><span><span className="block font-mono text-xs font-medium">{permission.code}</span>{permission.description && <span className="mt-1 block text-xs text-muted-foreground">{permission.description}</span>}</span></button>; })}</div></div>)}</div></> : <p className="text-sm text-muted-foreground">Select a role to manage its permissions.</p>}</Card></div>{showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={createRole} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Create custom role</h2><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Role name<Input required value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} className="mt-1.5" placeholder="e.g. Team Lead" /></label><label className="block text-sm font-medium">Description<Input value={newRoleDescription} onChange={(event) => setNewRoleDescription(event.target.value)} className="mt-1.5" /></label><label className="block text-sm font-medium">Data scope<select value={scope} onChange={(event) => setScope(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="all">All people</option><option value="department">Department</option><option value="team">Team</option><option value="self">Self</option></select></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create role"}</Button></div></form></div>}</div>;
}
