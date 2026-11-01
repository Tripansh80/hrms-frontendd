"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "cancelled";
  due_date: string | null;
  first_name: string;
  last_name: string;
  employee_no: string;
  created_at: string;
};
type Employee = { id: string; first_name: string; last_name: string; employee_no: string; designation: string | null };

const labels = { todo: "To do", in_progress: "In progress", done: "Done", cancelled: "Cancelled" };

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignee_employee_id: "", due_date: "" });

  const load = async () => {
    try {
      const [taskResponse, employeeResponse] = await Promise.all([
        api<{ items: Task[] }>("GET", "/tasks"),
        api<{ items: Employee[] }>("GET", "/employees?limit=100"),
      ]);
      setTasks(taskResponse.items);
      setEmployees(employeeResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load task overview.");
    }
  };
  useEffect(() => { load(); }, []);

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("POST", "/tasks", { ...form, due_date: form.due_date || null });
      setForm({ title: "", description: "", assignee_employee_id: "", due_date: "" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((task) => task.status === "done").length,
    active: tasks.filter((task) => task.status === "in_progress").length,
    pending: tasks.filter((task) => task.status === "todo").length,
  }), [tasks]);

  const assigneeSummary = useMemo(() => {
    const summary = new Map<string, { name: string; employeeNo: string; assigned: number; completed: number }>();
    tasks.forEach((task) => {
      const key = task.employee_no;
      const current = summary.get(key) || { name: `${task.first_name} ${task.last_name}`, employeeNo: key, assigned: 0, completed: 0 };
      current.assigned += 1;
      if (task.status === "done") current.completed += 1;
      summary.set(key, current);
    });
    return Array.from(summary.values());
  }, [tasks]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Task overview" description="Track work assigned to your department and see who has completed it." primaryAction={<Button onClick={() => setShowCreate(true)}><ClipboardList className="h-4 w-4" />Create task</Button>} />
      {error && <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total assigned" value={counts.total} sub="Tasks created for your team" />
        <StatCard label="Completed" value={counts.done} sub="Marked done by employees" />
        <StatCard label="In progress" value={counts.active} sub="Currently being worked on" />
        <StatCard label="Pending" value={counts.pending} sub="Not started yet" />
      </div>
      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="font-semibold">Team progress</h2></div>
        {assigneeSummary.length === 0 ? <p className="text-sm text-muted-foreground">No tasks assigned yet.</p> : <div className="grid gap-3 md:grid-cols-2">{assigneeSummary.map((person) => <div key={person.employeeNo} className="rounded-lg border border-border p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{person.name}</p><p className="text-xs text-muted-foreground">{person.employeeNo}</p></div><span className="text-sm font-semibold text-primary">{person.completed}/{person.assigned} complete</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${person.assigned ? (person.completed / person.assigned) * 100 : 0}%` }} /></div></div>)}</div>}
      </Card>
      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-border p-5"><ClipboardList className="h-5 w-5 text-primary" /><h2 className="font-semibold">Assigned task details</h2></div>
        {tasks.length === 0 ? <p className="p-8 text-sm text-muted-foreground">No assigned tasks yet.</p> : <div className="divide-y divide-border">{tasks.map((task) => <div key={task.id} className="flex items-start gap-4 p-5"><div className="rounded-lg bg-primary-soft p-2 text-primary">{task.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{task.title}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{labels[task.status]}</span></div><p className="mt-1 text-sm text-muted-foreground">Assigned to {task.first_name} {task.last_name} · {task.employee_no}</p>{task.description && <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>}<p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{task.due_date ? `Due ${task.due_date}` : "No due date"}</p></div></div>)}</div>}
      </Card>
      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={createTask} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Create task</h2><p className="mt-1 text-sm text-muted-foreground">Assign work to someone in your department.</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Task title<Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="block text-sm font-medium">Assign to<select required value={form.assignee_employee_id} onChange={(event) => setForm({ ...form, assignee_employee_id: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name} · {employee.employee_no}</option>)}</select></label><label className="block text-sm font-medium">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></label><label className="block text-sm font-medium">Due date<Input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create task"}</Button></div></form></div>}
    </div>
  );
}
