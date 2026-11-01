"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Job = { id: string; file_name: string; status: string; total_rows: number; processed_rows: number; failed_rows: number };

export default function ImportsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { api<{ items: Job[] }>("GET", "/imports").then((r) => setJobs(r.items)).catch((e) => setMessage(e.message)); }, []);
  return <main className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Bulk employee imports</h1>
      <Link className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white" href="/imports/new">New import</Link></div>
    {message && <p className="rounded-lg border p-4 text-sm">{message}</p>}
    <div className="overflow-hidden rounded-xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-[hsl(var(--surface-2))]"><th className="p-3">File</th><th>Status</th><th>Rows</th><th /></tr></thead><tbody>
      {jobs.map((job) => <tr className="border-b last:border-0" key={job.id}><td className="p-3">{job.file_name}</td><td>{job.status}</td><td>{job.processed_rows}/{job.total_rows} ({job.failed_rows} errors)</td><td><Link className="text-[hsl(var(--primary))]" href={`/imports/${job.id}`}>View</Link></td></tr>)}
      {!jobs.length && <tr><td className="p-4 text-muted-foreground" colSpan={4}>No imports yet.</td></tr>}
    </tbody></table></div>
  </main>;
}
