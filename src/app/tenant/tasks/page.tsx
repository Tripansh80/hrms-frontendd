"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "cancelled";
  due_date: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
};

const statusLabels = { todo: "To do", in_progress: "In progress", done: "Done", cancelled: "Cancelled" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setTasks((await api<{ items: Task[] }>("GET", "/tasks?assigned_only=true")).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks.");
    }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (task: Task, status: Task["status"]) => {
    try {
      const saved = await api<Task>("PATCH", `/tasks/${task.id}`, { status });
      setTasks((current) => current.map((item) => item.id === saved.id ? { ...item, status: saved.status } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My tasks" description="Tasks assigned to you by your manager." />
      {error && <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      <Card className="p-0">
        {tasks.length === 0 ? <div className="p-12 text-center"><ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No tasks assigned yet.</p></div> : <div className="divide-y divide-border">{tasks.map((task) => <div key={task.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start"><div className="rounded-lg bg-primary-soft p-2 text-primary"><ClipboardList className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{task.title}</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{statusLabels[task.status]}</span></div>{task.description && <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>}<p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{task.due_date ? `Due ${task.due_date}` : "No due date"}</p></div>{task.status !== "done" && task.status !== "cancelled" && <div className="flex gap-2"><Button variant="secondary" onClick={() => updateStatus(task, "in_progress")} disabled={task.status === "in_progress"}>In progress</Button><Button onClick={() => updateStatus(task, "done")}><CheckCircle2 className="h-4 w-4" />Done</Button></div>}</div>)}</div>}
      </Card>
    </div>
  );
}
