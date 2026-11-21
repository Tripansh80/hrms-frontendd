"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ChevronRight, MapPin, Search, Users } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type DirectoryPerson = {
  id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  work_email: string;
  department_name: string | null;
  team_name: string | null;
  manager_name: string | null;
};

type DirectoryResponse = {
  items: DirectoryPerson[];
  next_cursor: string | null;
};

function initials(person: DirectoryPerson) {
  return `${person.first_name[0] ?? ""}${person.last_name[0] ?? ""}`.toUpperCase();
}

export default function DirectoryPage() {
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      api<DirectoryResponse>("GET", `/directory?${new URLSearchParams(query ? { q: query } : {})}`)
        .then((response) => {
          setPeople(response.items);
          setError(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load the directory."))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Company directory"
        description="Find colleagues and open their public profile."
        scopeChip="Public information"
      />
      <Card className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, designation, or department..."
            className="pl-9"
          />
        </div>
      </Card>
      {error && <Card className="mb-6 border-danger/30 bg-danger-soft"><p className="text-sm text-danger">{error}</p></Card>}
      {loading ? (
        <Card><p className="text-sm text-muted-foreground">Loading directory...</p></Card>
      ) : people.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground">No colleagues found.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <Card key={person.id} className="group transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {initials(person)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{person.first_name} {person.last_name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{person.designation || "Team member"}</p>
                </div>
                <Link href={`/organization/chart?focus=${person.id}`} aria-label={`Open ${person.first_name}'s org chart`}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />{person.department_name || "No department"}{person.team_name ? ` · ${person.team_name}` : ""}</p>
                {person.manager_name && <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Reports to {person.manager_name}</p>}
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{person.work_email}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link href="/organization/chart"><Button variant="secondary">Open organization chart <ChevronRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}
