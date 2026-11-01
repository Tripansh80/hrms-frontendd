"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, ChevronDown, ChevronRight, ChevronUp, FolderTree, Pencil, Plus, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/authStore";

type Department = {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  manager_id: string | null;
};

type DepartmentsResponse = { items: Department[] };
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_no: string;
  status: string;
  designation?: string | null;
  department_id?: string | null;
};
type DepartmentPeople = { assigned: Employee[]; available: Employee[] };
type DepartmentAnalytics = {
  id: string;
  name: string;
  code: string;
  employee_count: number;
  active_count: number;
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const canManage = user?.permissions.includes("tenant.update") ?? false;
  const canViewDepartmentEmployees = user?.permissions.includes("employees.read") ?? false;
  const canManageEmployees = canViewDepartmentEmployees && (
    user?.permissions.includes("employees.update") ||
    user?.roles.some((role) => ["Department Manager", "People Manager", "Tenant Owner"].includes(role)) === true
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [departmentPeople, setDepartmentPeople] = useState<Record<string, DepartmentPeople>>({});
  const [expandedDepartments, setExpandedDepartments] = useState<Record<string, boolean>>({});
  const [peopleLoading, setPeopleLoading] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);
  const analyticsEnabled = process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "true";
  const departmentProfilesEnabled = process.env.NEXT_PUBLIC_FEATURE_DEPARTMENT_PROFILES === "true";

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api<DepartmentsResponse>("GET", "/departments");
      setDepartments(response.items);
      if (analyticsEnabled) {
        try {
          setAnalytics((await api<{ items: DepartmentAnalytics[] }>("GET", "/departments/analytics")).items);
        } catch {
          setAnalytics([]);
        }
      }
      try {
        const employeeResponse = await api<{ items: Employee[] }>("GET", "/employees?limit=100");
        setEmployees(employeeResponse.items.filter((employee) => employee.status !== "exited"));
      } catch {
        setEmployees([]);
        setError("Departments loaded, but managers could not be loaded. Check employee directory access.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const departmentById = useMemo(() => new Map(departments.map((department) => [department.id, department])), [departments]);
  const filteredDepartments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return departments;
    return departments.filter((department) => `${department.name} ${department.code}`.toLowerCase().includes(normalized));
  }, [departments, query]);
  const rootCount = departments.filter((department) => !department.parent_id).length;
  const nestedCount = departments.length - rootCount;
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  const closeCreate = () => {
    setShowCreate(false);
    setEditing(null);
    setName("");
    setCode("");
    setParentId("");
    setManagerId("");
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setCode("");
    setShowCreate(true);
  };

  const suggestedDepartments = ["Engineering", "Human Resources", "Finance", "Sales", "Marketing", "Operations", "Customer Support", "Administration"];

  const openEdit = (department: Department) => {
    setEditing(department);
    setName(department.name);
    setCode(department.code);
    setParentId(department.parent_id || "");
    setManagerId(department.manager_id || "");
    setShowCreate(true);
  };

  const saveDepartment = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() ? code.trim().toUpperCase() : null,
        parent_id: parentId || null,
        manager_id: managerId || null,
      };
      const department = editing
        ? await api<Department>("PATCH", `/departments/${editing.id}`, payload)
        : await api<Department>("POST", "/departments", payload);
      setDepartments((current) => (
        editing
          ? current.map((item) => item.id === department.id ? department : item)
          : [...current, department].sort((a, b) => a.name.localeCompare(b.name))
      ));
      closeCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the department.");
    } finally {
      setCreating(false);
    }
  };

  const deleteDepartment = async (department: Department) => {
    if (!window.confirm(`Delete ${department.name}? Departments with sub-departments cannot be deleted.`)) return;
    setDeletingId(department.id);
    setError(null);
    try {
      await api("DELETE", `/departments/${department.id}`);
      setDepartments((current) => current.filter((item) => item.id !== department.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the department.");
    } finally {
      setDeletingId(null);
    }
  };

  const loadDepartmentPeople = async (departmentId: string) => {
    setPeopleLoading(departmentId);
    try {
      const response = await api<DepartmentPeople>("GET", `/departments/${departmentId}/employees`);
      setDepartmentPeople((current) => ({ ...current, [departmentId]: response }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load department employees.");
    } finally {
      setPeopleLoading(null);
    }
  };

  const toggleDepartment = async (departmentId: string) => {
    const expanded = !expandedDepartments[departmentId];
    setExpandedDepartments((current) => ({ ...current, [departmentId]: expanded }));
    if (expanded && !departmentPeople[departmentId]) await loadDepartmentPeople(departmentId);
  };

  const addEmployee = async (departmentId: string, employee: Employee) => {
    try {
      await api("POST", `/departments/${departmentId}/employees/${employee.id}`);
      await loadDepartmentPeople(departmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add employee to department.");
    }
  };

  const removeEmployee = async (departmentId: string, employee: Employee) => {
    if (!window.confirm(`Remove ${employee.first_name} ${employee.last_name} from this department?`)) return;
    try {
      await api("DELETE", `/departments/${departmentId}/employees/${employee.id}`);
      await loadDepartmentPeople(departmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove employee from department.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Departments"
        description="Organize teams and reporting groups across your workspace."
        primaryAction={canManage ? <Button onClick={openCreate}><Plus className="h-4 w-4" />Add department</Button> : undefined}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total departments" value={departments.length} sub="Active organizational groups" />
        <StatCard label="Top-level groups" value={rootCount} sub="Independent reporting groups" />
        <StatCard label="Sub-departments" value={nestedCount} sub="Groups within another department" />
      </div>
      {analyticsEnabled && <Card className="mb-6"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Department analytics</h2><p className="text-xs text-muted-foreground">Active and total employee distribution by department.</p></div></div>{analytics.length === 0 ? <p className="text-sm text-muted-foreground">No analytics data available.</p> : <div className="grid gap-3 md:grid-cols-2">{analytics.map((item) => <div key={item.id} className="rounded-lg border border-border p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{item.name}</p><p className="font-mono text-[11px] text-muted-foreground">{item.code}</p></div><span className="text-sm font-semibold text-primary">{item.active_count}/{item.employee_count} active</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.employee_count ? (Number(item.active_count) / Number(item.employee_count)) * 100 : 0}%` }} /></div></div>)}</div>}</Card>}

      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-primary" /><h2 className="font-semibold">Department directory</h2></div>
          <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search departments" className="pl-9" /></div>
        </div>

        {error && <div className="m-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}

        {loading ? (
          <p className="p-8 text-sm text-muted-foreground">Loading departments...</p>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-12 text-center"><Building2 className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">No departments found</h3><p className="mt-1 text-sm text-muted-foreground">Create a department to start organizing your workspace.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {filteredDepartments.map((department) => {
              const parent = department.parent_id ? departmentById.get(department.parent_id) : null;
              return (
                <div key={department.id} className="border-b border-border last:border-b-0">
                  <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">{initials(department.name)}</div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{department.name}</p><span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{department.code}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{parent ? <><ChevronRight className="h-3.5 w-3.5" />Part of {parent.name}</> : "Top-level department"}</p></div>
                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Users className="h-3.5 w-3.5" />{department.manager_id ? employeeById.get(department.manager_id) ? `${employeeById.get(department.manager_id)?.first_name} ${employeeById.get(department.manager_id)?.last_name}` : "Manager assigned" : "No manager"}</div>
                  {canViewDepartmentEmployees && <button onClick={() => toggleDepartment(department.id)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" title="View employees">{expandedDepartments[department.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>}
                  {departmentProfilesEnabled && <Link href={`/organization/departments/${department.id}`} title={`View ${department.name} profile`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Building2 className="h-4 w-4" /></Link>}
                  {canManage && <button onClick={() => openEdit(department)} title={`Edit ${department.name}`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>}
                  {canManage && <button onClick={() => deleteDepartment(department)} disabled={deletingId === department.id} title={`Delete ${department.name}`} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  {expandedDepartments[department.id] && <div className="border-t border-border bg-muted/20 px-5 py-4 pl-16">
                    {peopleLoading === department.id ? <p className="text-sm text-muted-foreground">Loading department tree...</p> : <div className="grid gap-5 lg:grid-cols-2">
                      <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department employees</p><div className="space-y-2">{(departmentPeople[department.id]?.assigned || []).map((employee) => <div key={employee.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(`${employee.first_name} ${employee.last_name}`)}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{employee.first_name} {employee.last_name}</p><p className="text-xs text-muted-foreground">{employee.employee_no} · {employee.designation || "Employee"}</p></div>{canManageEmployees && <button onClick={() => removeEmployee(department.id, employee)} className="rounded p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger" title="Remove from department"><Trash2 className="h-4 w-4" /></button>}</div>)}{departmentPeople[department.id]?.assigned.length === 0 && <p className="text-sm text-muted-foreground">No employees assigned yet.</p>}</div></div>
                      <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available employees</p><div className="space-y-2">{(departmentPeople[department.id]?.available || []).map((employee) => <div key={employee.id} className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card px-3 py-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{employee.first_name} {employee.last_name}</p><p className="text-xs text-muted-foreground">{employee.employee_no} · {employee.designation || "Employee"}</p></div>{canManageEmployees && <button onClick={() => addEmployee(department.id, employee)} className="rounded p-1.5 text-primary hover:bg-primary-soft" title="Add to department"><UserPlus className="h-4 w-4" /></button>}</div>)}{departmentPeople[department.id]?.available.length === 0 && <p className="text-sm text-muted-foreground">No unassigned employees available.</p>}</div></div>
                    </div>}
                  </div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={saveDepartment} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{editing ? "Edit department" : "Add department"}</h2><p className="mt-1 text-sm text-muted-foreground">{editing ? "Update the department details and manager." : "Create an organizational group for your workspace."}</p></div><button type="button" onClick={closeCreate} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-4">
              {!editing && <div><p className="mb-2 text-sm font-medium">Suggested departments</p><div className="flex flex-wrap gap-2">{suggestedDepartments.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setName(suggestion); setCode(""); }} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${name === suggestion ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground hover:bg-muted"}`}>{suggestion}</button>)}</div></div>}
              <label className="block text-sm font-medium">Department name<Input required value={name} onChange={(event) => { setName(event.target.value); if (!editing) setCode(""); }} className="mt-1.5" placeholder="e.g. Engineering" /></label>
              <label className="block text-sm font-medium">Code <span className="font-normal text-muted-foreground">(optional, auto-generated)</span><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-1.5" placeholder={name ? "Generated from department name" : "e.g. ENG"} pattern="[A-Za-z0-9_-]+" /></label>
              <label className="block text-sm font-medium">Parent department <span className="font-normal text-muted-foreground">(optional)</span><select value={parentId} onChange={(event) => setParentId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"><option value="">No parent department</option>{departments.filter((department) => department.id !== editing?.id).map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label>
              <label className="block text-sm font-medium">Department manager <span className="font-normal text-muted-foreground">(optional)</span><select value={managerId} onChange={(event) => setManagerId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"><option value="">No manager assigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name} ({employee.employee_no})</option>)}</select></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={closeCreate}>Cancel</Button><Button type="submit" disabled={creating}>{creating ? "Saving..." : editing ? "Save changes" : "Create department"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
