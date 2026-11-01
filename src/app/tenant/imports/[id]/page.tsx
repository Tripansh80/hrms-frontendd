"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Job = { id: string; file_name: string; status: string; total_rows: number; processed_rows: number; failed_rows: number };
type ErrorRow = { row_number: number; field: string; message: string; raw_data: Record<string, string> };
type PreviewRow = Record<string, string>;

export default function ImportDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job>(); const [errors, setErrors] = useState<ErrorRow[]>([]); const [preview, setPreview] = useState<PreviewRow[]>([]); const [message, setMessage] = useState("");
  const load = () => Promise.all([api<Job>("GET", `/imports/${params.id}`), api<{ items: ErrorRow[] }>("GET", `/imports/${params.id}/errors`), api<{ items: PreviewRow[] }>("GET", `/imports/${params.id}/preview`)]).then(([j, e, p]) => { setJob(j); setErrors(e.items); setPreview(p.items); }).catch((e) => setMessage(e.message));
  useEffect(() => { load(); }, [params.id]);
  async function execute() { try { await api("POST", `/imports/${params.id}/execute`); await load(); } catch (e) { setMessage((e as Error).message); } }
  if (!job) return <main>{message || "Loading…"}</main>;
  return <main className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{job.file_name}</h1>
    {job.status === "queued" && <button className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white" onClick={execute}>Import valid rows</button>}</div>
    <p className="text-sm">Status: <strong>{job.status}</strong> · {job.total_rows} processed · {job.failed_rows} invalid</p>
    {message && <p className="rounded-lg border p-3 text-sm">{message}</p>}
    <section className="space-y-2"><h2 className="font-semibold">Preview ({preview.length} rows)</h2><div className="overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Employee number</th><th>Employee</th><th>Email</th><th>Department</th></tr></thead><tbody>{preview.slice(0, 50).map((row, i) => <tr className="border-b" key={i}><td className="p-3">{row.employee_no}</td><td>{row.first_name} {row.last_name}</td><td>{row.email}</td><td>{row.department || "—"}</td></tr>)}</tbody></table></div></section>
    <section className="space-y-2"><h2 className="font-semibold">Row errors ({errors.length})</h2>{errors.length === 0 ? <p className="text-sm text-muted-foreground">No validation errors.</p> :
      <div className="overflow-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Row</th><th>Field</th><th>Problem</th></tr></thead><tbody>{errors.map((e, i) => <tr className="border-b" key={`${e.row_number}-${e.field}-${i}`}><td className="p-3">{e.row_number}</td><td>{e.field}</td><td>{e.message}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
