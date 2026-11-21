"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ClipboardPlus, Mail, Pencil, Plus, Search, Send, ShieldAlert, Trash2, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type Employee = {
  id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string | null;
  employment_type: string;
  status: "onboarding" | "active" | "on_notice" | "suspended" | "exited";
  joining_date: string;
  user_id: string | null;
  manager_id: string | null;
  department_id: string | null;
  department_manager_id: string | null;
  department_name: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  is_owner: boolean;
  invitation_status: "not_invited" | "invited" | "active";
};

type EmployeesResponse = { items: Employee[]; next_cursor: string | null };
type Department = { id: string; name: string; code: string };
type Role = { id: string; name: string; description: string; is_system: boolean; data_scope: string };

const statusStyles: Record<Employee["status"], string> = {
  active: "bg-success-soft text-success",
  onboarding: "bg-ai-soft text-ai",
  on_notice: "bg-warning-soft text-warning",
  suspended: "bg-danger-soft text-danger",
  exited: "bg-muted text-muted-foreground",
};

const today = new Date().toISOString().slice(0, 10);

type HierarchyEmployee = Employee & { children: HierarchyEmployee[] };

function HierarchyNode({ employee }: { employee: HierarchyEmployee }) {
  return (
    <div className="relative">
      <div className={`flex items-center gap-3 rounded-lg border bg-card px-4 py-3 ${employee.is_owner ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
          {employee.first_name[0]}{employee.last_name[0] || ""}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{employee.first_name} {employee.last_name}{employee.is_owner && <span className="ml-2 text-xs font-medium text-primary">Company owner</span>}</p>
          <p className="truncate text-xs text-muted-foreground">{employee.designation || "No designation"} · {employee.employee_no}</p>
        </div>
      </div>
      {employee.children.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l border-border pl-5">
          {employee.children.map((child) => <HierarchyNode key={child.id} employee={child} />)}
        </div>
      )}
    </div>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", designation: "", department_id: "", manager_id: "", joining_date: today, employment_type: "full_time", status: "onboarding" });
  const [editing, setEditing] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [taskEmployee, setTaskEmployee] = useState<Employee | null>(null);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", due_date: "" });
  const [taskSaving, setTaskSaving] = useState(false);
  const invitationsEnabled = process.env.NEXT_PUBLIC_FEATURE_EMPLOYEE_INVITATIONS === "true";
  const [sendInvitation, setSendInvitation] = useState(false);

  const canRead = user?.permissions.includes("employees.read") ?? false;
  const canCreate = user?.permissions.includes("employees.create") ?? false;
  const canDelete = user?.permissions.includes("employees.delete") ?? false;
  const canManageRoles = user?.permissions.includes("roles.read") ?? false;
  const canAssignRoles = (user?.permissions.includes("roles.manage") ?? false) && canManageRoles;
  const canAssignTasks = (user?.permissions.includes("employees.read") ?? false) &&
    !user?.roles.includes("Employee");

  const loadEmployees = async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const response = await api<EmployeesResponse>("GET", "/employees?limit=100");
      setEmployees(response.items);
      try {
        setDepartments((await api<{ items: Department[] }>("GET", "/departments")).items);
      } catch {
        setDepartments([]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load people.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadEmployees();
  }, [user]);

  useEffect(() => {
    if (!showCreate || !canAssignRoles) return;
    api<{ items: Role[] }>("GET", "/roles").then((response) => setRoles(response.items)).catch((err) => setError(err instanceof Error ? err.message : "Could not load roles."));
    if (editing?.user_id) api<{ items: Role[] }>("GET", `/users/${editing.user_id}/roles`).then((response) => setSelectedRoleIds(response.items.map((role) => role.id))).catch((err) => setError(err instanceof Error ? err.message : "Could not load assigned roles."));
  }, [showCreate, canAssignRoles, editing]);

  const visibleEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return employees;
    return employees.filter((employee) => `${employee.first_name} ${employee.last_name} ${employee.email} ${employee.employee_no}`.toLowerCase().includes(normalized));
  }, [employees, query]);

  const hierarchy = useMemo(() => {
    const employeeIds = new Set(visibleEmployees.map((employee) => employee.id));
    const childrenByManager = new Map<string, Employee[]>();
    visibleEmployees.forEach((employee) => {
      const managerId = employee.manager_id && employee.manager_id !== employee.id
        ? employee.manager_id
        : employee.department_manager_id && employee.department_manager_id !== employee.id
          ? employee.department_manager_id
          : null;
      if (managerId && employeeIds.has(managerId)) {
        const children = childrenByManager.get(managerId) || [];
        children.push(employee);
        childrenByManager.set(managerId, children);
      }
    });

    const buildNode = (employee: Employee): HierarchyEmployee => ({
      ...employee,
      children: (childrenByManager.get(employee.id) || []).map(buildNode),
    });

    return visibleEmployees
      .filter((employee) => !Array.from(childrenByManager.values()).some((children) => children.some((child) => child.id === employee.id)))
      .sort((left, right) => Number(right.is_owner) - Number(left.is_owner))
      .map(buildNode);
  }, [visibleEmployees]);

  const closeCreate = () => {
    setShowCreate(false);
    setEditing(null);
    setForm({ first_name: "", last_name: "", email: "", designation: "", department_id: "", manager_id: "", joining_date: today, employment_type: "full_time", status: "onboarding" });
    setSendInvitation(false);
    setSelectedRoleIds([]);
    setSendInvitation(false);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({ first_name: employee.first_name, last_name: employee.last_name, email: employee.email, designation: employee.designation || "", department_id: employee.department_id || "", manager_id: employee.manager_id || "", joining_date: employee.joining_date, employment_type: employee.employment_type, status: employee.status });
    setSelectedRoleIds([]);
    setShowCreate(true);
  };

  const saveEmployee = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        ...form,
        designation: form.designation.trim() || null,
        department_id: form.department_id || null,
        manager_id: form.manager_id || null,
        ...(!invitationsEnabled && canAssignRoles ? { role_ids: selectedRoleIds } : {}),
        ...(invitationsEnabled && !editing ? { send_invitation: sendInvitation } : {}),
      };
      const saved = editing
        ? await api<Employee>("PATCH", `/employees/${editing.id}`, payload)
        : await api<Employee>("POST", "/employees", payload);
      let updated = saved;
      if (!editing && invitationsEnabled && sendInvitation) {
        await api("POST", `/employees/${saved.id}/invite`);
        updated = { ...saved, invitation_status: "invited" as const };
      }
      setEmployees((current) => editing
        ? current.map((employee) => employee.id === saved.id ? { ...employee, ...updated, invitation_status: updated.invitation_status || employee.invitation_status } : employee)
        : [updated, ...current]);
      closeCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this person.");
    } finally {
      setCreating(false);
    }
  };

  const inviteEmployee = async (employee: Employee) => {
    try {
      await api("POST", `/employees/${employee.id}/invite`);
      setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, invitation_status: "invited" } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invitation.");
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Remove ${employee.first_name} ${employee.last_name} from People?`)) return;
    setDeletingId(employee.id);
    setError(null);
    try {
      await api("DELETE", `/employees/${employee.id}`);
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this person.");
    } finally {
      setDeletingId(null);
    }
  };

  const saveTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!taskEmployee) return;
    setTaskSaving(true);
    try {
      await api("POST", "/tasks", { ...taskForm, assignee_employee_id: taskEmployee.id, due_date: taskForm.due_date || null });
      setTaskEmployee(null);
      setTaskForm({ title: "", description: "", due_date: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign task.");
    } finally {
      setTaskSaving(false);
    }
  };

  if (user && !canRead) {
    return <Card className="mx-auto max-w-lg text-center"><ShieldAlert className="mx-auto h-9 w-9 text-danger" /><h1 className="mt-3 text-lg font-semibold">People access required</h1><p className="mt-1 text-sm text-muted-foreground">Your role needs the <code>employees.read</code> permission to view this directory.</p></Card>;
  }

  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const onboardingCount = employees.filter((employee) => employee.status === "onboarding").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="People" description="Manage employee profiles and onboarding across your workspace." primaryAction={<div className="flex items-center gap-2">{canManageRoles && <Link href="/settings/roles" className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Roles & permissions</Link>}{canCreate && <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Add person</Button>}</div>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Total people" value={employees.length} sub="Visible within your access scope" /><StatCard label="Active" value={activeCount} sub="Currently active employees" /><StatCard label="Onboarding" value={onboardingCount} sub="New people joining the team" /></div>

      {!loading && hierarchy.length > 0 && <Card className="mb-6"><div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="font-semibold">People hierarchy</h2></div><div className="grid gap-3 md:grid-cols-2">{hierarchy.map((employee) => <HierarchyNode key={employee.id} employee={employee} />)}</div></Card>}

      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="font-semibold">People directory</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Select a person to view their full profile.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or ID" className="pl-9" />
          </div>
        </div>
        {error && <div className="m-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
        {loading ? <p className="p-8 text-sm text-muted-foreground">Loading people...</p> : visibleEmployees.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">No people found</h3><p className="mt-1 text-sm text-muted-foreground">Add a person to start building your workspace directory.</p></div> :
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEmployees.map((employee) => (
              <article
                key={employee.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/employees/${employee.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") router.push(`/employees/${employee.id}`);
                }}
                className={`group cursor-pointer rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 ${employee.is_owner ? "border-primary/40" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
                      {employee.first_name[0]}{employee.last_name[0] || ""}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{employee.first_name} {employee.last_name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{employee.employee_no}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${statusStyles[employee.status]}`}>{employee.status.replace("_", " ")}</span>
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  <p className="flex items-center gap-2 truncate text-foreground"><BriefcaseBusiness className="h-4 w-4 shrink-0 text-muted-foreground" />{employee.designation || "No designation"}</p>
                  <p className="flex items-center gap-2 truncate text-muted-foreground"><Mail className="h-4 w-4 shrink-0" />{employee.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{employee.department_name || "No department"}{employee.manager_first_name ? ` · Reports to ${employee.manager_first_name} ${employee.manager_last_name || ""}` : ""}</p>
                </div>
                {employee.is_owner && <p className="mt-4 text-xs font-semibold text-primary">Company owner</p>}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">View profile</span>
                  <div className="ml-auto flex items-center gap-1">
                    {invitationsEnabled && employee.invitation_status === "not_invited" && user?.permissions.includes("employees.update") && <button onClick={(event) => { event.stopPropagation(); inviteEmployee(employee); }} title="Send invitation" className="rounded-lg p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary"><Send className="h-4 w-4" /></button>}
                    {canAssignTasks && <button onClick={(event) => { event.stopPropagation(); setTaskEmployee(employee); }} title="Assign task" className="rounded-lg p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary"><ClipboardPlus className="h-4 w-4" /></button>}
                    {user?.permissions.includes("employees.update") && <button onClick={(event) => { event.stopPropagation(); openEdit(employee); }} title={`Edit ${employee.first_name}`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"><Pencil className="h-4 w-4" /></button>}
                    {canDelete && <button onClick={(event) => { event.stopPropagation(); deleteEmployee(employee); }} disabled={deletingId === employee.id} title={`Remove ${employee.first_name}`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              </article>
            ))}
          </div>}
      </Card>

      {taskEmployee && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={saveTask} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Assign task</h2><p className="mt-1 text-sm text-muted-foreground">Assigning to {taskEmployee.first_name} {taskEmployee.last_name}</p><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Task title<Input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label><label className="block text-sm font-medium">Description<textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></label><label className="block text-sm font-medium">Due date<Input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setTaskEmployee(null)}>Cancel</Button><Button type="submit" disabled={taskSaving}>{taskSaving ? "Assigning..." : "Assign task"}</Button></div></form></div>}

      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4"><form onSubmit={saveEmployee} className="my-8 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{editing ? "Edit person" : "Add person"}</h2><p className="mt-1 text-sm text-muted-foreground">{editing ? "Update profile details, status, and role access." : "They will start in onboarding status."}</p></div><button type="button" onClick={closeCreate} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">First name<Input required value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} className="mt-1.5" /></label><label className="text-sm font-medium">Last name<Input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} className="mt-1.5" /></label><label className="text-sm font-medium sm:col-span-2">Email<Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5" /></label><label className="text-sm font-medium">Designation<Input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} className="mt-1.5" placeholder="e.g. Product Designer" /></label><label className="text-sm font-medium">Department<select value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value, manager_id: "" })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="">No department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label className="text-sm font-medium sm:col-span-2">Reporting manager<select value={form.manager_id} onChange={(event) => setForm({ ...form, manager_id: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="">No reporting manager</option>{employees.filter((employee) => employee.id !== editing?.id && (!form.department_id || employee.department_id === form.department_id)).map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name} · {employee.employee_no}</option>)}</select></label><label className="text-sm font-medium">Joining date<Input required type="date" value={form.joining_date} onChange={(event) => setForm({ ...form, joining_date: event.target.value })} className="mt-1.5" /></label><label className="text-sm font-medium">Employment type<select value={form.employment_type} onChange={(event) => setForm({ ...form, employment_type: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></label>{editing && <label className="text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="on_notice">On notice</option><option value="suspended">Suspended</option><option value="exited">Exited</option></select></label>}      </div>{invitationsEnabled && !editing && <label className="mt-5 flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={sendInvitation} onChange={(event) => setSendInvitation(event.target.checked)} className="mt-1" /><span><span className="block font-medium">Send login invitation</span><span className="mt-1 block text-xs text-muted-foreground">The employee record can be created without a login. You can invite them later.</span></span></label>}{canAssignRoles && <div className="mt-5 border-t border-border pt-5"><div><h3 className="text-sm font-semibold">Roles & permissions</h3><p className="mt-1 text-xs text-muted-foreground">Assigning roles provisions an account and invitation when this person does not yet have one.</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{roles.map((role) => { const selected = selectedRoleIds.includes(role.id); return <button key={role.id} type="button" onClick={() => setSelectedRoleIds((current) => selected ? current.filter((id) => id !== role.id) : [...current, role.id])} className={`rounded-lg border p-3 text-left transition-colors ${selected ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"}`}><span className="block text-sm font-medium">{role.name}</span><span className="mt-1 block text-xs text-muted-foreground">{role.description || `${role.data_scope} access`}</span></button>; })}</div></div>}<div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={closeCreate}>Cancel</Button><Button type="submit" disabled={creating}>{creating ? "Saving..." : editing ? "Save changes" : "Add person"}</Button></div></form></div>}
    </div>
  );
}
