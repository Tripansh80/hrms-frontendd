"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, GitBranch, Users } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  department_name?: string | null;
  team_name?: string | null;
  direct_reports?: number;
};

type ChartResponse = {
  chain: Person[];
  focus: Person & { department_name: string | null; team_name: string | null; direct_reports: number };
  reports: Person[];
};

function PersonCard({ person, active = false }: { person: Person; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {(person.first_name[0] ?? "") + (person.last_name[0] ?? "")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{person.first_name} {person.last_name}</p>
          <p className="truncate text-xs text-muted-foreground">{person.designation || "Team member"}</p>
        </div>
      </div>
      {person.direct_reports !== undefined && (
        <p className="mt-3 text-xs text-muted-foreground">{person.direct_reports} direct reports</p>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [departmentTree, setDepartmentTree] = useState<Array<{ id: string; name: string; head_name: string | null; active_headcount: number }>>([]);
  const [mode, setMode] = useState<"reporting" | "department">("reporting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChart = (focus?: string) => {
    setLoading(true);
    api<ChartResponse>("GET", `/org-chart${focus ? `?focus=${focus}` : ""}`)
      .then((response) => {
        setChart(response);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the organization chart."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadChart();
    api<{ items: typeof departmentTree }>("GET", "/org-chart/departments")
      .then((response) => setDepartmentTree(response.items))
      .catch(() => setDepartmentTree([]));
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Organization chart"
        description="Explore reporting lines or browse the organization by department."
        primaryAction={
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button onClick={() => setMode("reporting")} className={`rounded-md px-3 py-1.5 text-sm ${mode === "reporting" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Reporting lines</button>
            <button onClick={() => setMode("department")} className={`rounded-md px-3 py-1.5 text-sm ${mode === "department" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Departments</button>
          </div>
        }
      />
      {error && <Card className="mb-6 border-danger/30 bg-danger-soft"><p className="text-sm text-danger">{error}</p></Card>}
      {loading ? <Card><p className="text-sm text-muted-foreground">Loading organization chart...</p></Card> : mode === "department" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departmentTree.map((department) => (
            <Card key={department.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><GitBranch className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold">{department.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{department.head_name || "No department head"}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{department.active_headcount} active employees</p>
            </Card>
          ))}
        </div>
      ) : chart ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              {chart.chain.map((person, index) => (
                <div key={person.id} className="flex items-center gap-2">
                  <button onClick={() => loadChart(person.id)} className="text-left hover:text-primary"><PersonCard person={person} active={person.id === chart.focus.id} /></button>
                  {index < chart.chain.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Selected person</p>
              <PersonCard person={chart.focus} active />
              <div className="mt-4 flex gap-2">
                <Link href={`/employees/${chart.focus.id}`}><Button variant="secondary" size="sm">Open full profile</Button></Link>
              </div>
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="font-semibold">Direct reports</h2><p className="mt-1 text-sm text-muted-foreground">Select a person to recenter the chart.</p></div>
                <Users className="h-5 w-5 text-primary" />
              </div>
              {chart.reports.length === 0 ? <p className="text-sm text-muted-foreground">No direct reports.</p> : <div className="grid gap-3 sm:grid-cols-2">{chart.reports.map((person) => <button key={person.id} onClick={() => loadChart(person.id)} className="text-left"><PersonCard person={person} /></button>)}</div>}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
