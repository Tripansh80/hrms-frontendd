"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BookOpen, Bold, ChevronDown, ChevronUp, Italic, List, Plus, Search, Underline } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/authStore";

type Policy = { id: string; title: string; status: string; version: number; content: string; acknowledged: boolean };

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);

  const format = (command: string) => {
    editor.current?.focus();
    document.execCommand(command, false);
    onChange(editor.current?.innerHTML || "");
  };

  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted p-2">
        <button type="button" onClick={() => format("bold")} className="rounded p-2 hover:bg-card" title="Bold"><Bold className="h-4 w-4" /></button>
        <button type="button" onClick={() => format("italic")} className="rounded p-2 hover:bg-card" title="Italic"><Italic className="h-4 w-4" /></button>
        <button type="button" onClick={() => format("underline")} className="rounded p-2 hover:bg-card" title="Underline"><Underline className="h-4 w-4" /></button>
        <button type="button" onClick={() => format("insertUnorderedList")} className="rounded p-2 hover:bg-card" title="Bullet list"><List className="h-4 w-4" /></button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-44 p-3 text-sm outline-none"
        data-placeholder="Write the policy content..."
      />
    </div>
  );
}

function safePolicyHtml(content: string) {
  if (typeof document === "undefined") return content;
  const template = document.createElement("template");
  template.innerHTML = content;
  template.content.querySelectorAll("script,style,iframe,object,embed,form").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on") || attribute.name.toLowerCase() === "style") node.removeAttribute(attribute.name);
      if (attribute.name.toLowerCase() === "href" && !/^(https?:|mailto:)/i.test(attribute.value)) node.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

export default function PoliciesPage() {
  const { user } = useAuthStore();
  const canManage = user?.permissions.includes("policies.manage") ?? false;
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      setPolicies((await api<{ items: Policy[] }>("GET", "/policies")).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load policies.");
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = policies.filter((policy) => policy.title.toLowerCase().includes(query.toLowerCase()));
  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.content.replace(/<[^>]*>/g, "").trim()) {
      setError("Policy content is required.");
      return;
    }
    try {
      const policy = await api<Policy>("POST", "/policies", form);
      setPolicies((items) => [policy, ...items]);
      setShowCreate(false);
      setForm({ title: "", content: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create policy.");
    }
  };
  const toggleStatus = async (policy: Policy) => {
    try {
      const saved = await api<Policy>("POST", `/policies/${policy.id}/toggle-status`);
      setPolicies((items) => items.map((item) => item.id === policy.id ? { ...item, status: saved.status } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update policy status.");
    }
  };
  const allExpanded = filtered.length > 0 && filtered.every((policy) => expanded[policy.id]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Policies" description="Manage workplace policies and publish them for employees." primaryAction={canManage ? <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Create policy</Button> : undefined} />
      {error && <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total policies" value={policies.length} sub="Company policy records" />
        <StatCard label="Published" value={policies.filter((p) => p.status === "published").length} sub="Visible to employees" />
        <StatCard label="Drafts" value={policies.filter((p) => p.status === "draft").length} sub="Not visible to employees" />
      </div>
      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="font-semibold">Policy library</h2></div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search policies" className="pl-9" /></div>
        </div>
        {filtered.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No policies found.</p> : <div className="p-5"><div className="mb-4 flex justify-end">{canManage && <Button type="button" variant="secondary" onClick={() => setExpanded(Object.fromEntries(filtered.map((policy) => [policy.id, !allExpanded])))}>{allExpanded ? "Collapse all" : "Expand all"}</Button>}</div><div className="grid gap-4 md:grid-cols-2">{filtered.map((policy) => { const isExpanded = Boolean(expanded[policy.id]); return <article key={policy.id} className="rounded-xl border border-border bg-surface shadow-sm"><button type="button" onClick={() => setExpanded((current) => ({ ...current, [policy.id]: !isExpanded }))} className="flex w-full items-center gap-4 p-5 text-left hover:bg-muted"><div className="rounded-lg bg-primary-soft p-2 text-primary"><BookOpen className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{policy.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs ${policy.status === "published" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{policy.status}</span></div><p className="mt-1 text-xs text-muted-foreground">Version {policy.version || 1}</p></div>{isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}</button>{isExpanded && <div className="border-t border-border p-5"><div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: safePolicyHtml(policy.content) }} />{canManage && <Button type="button" variant="secondary" className="mt-5" onClick={() => toggleStatus(policy)}>{policy.status === "published" ? "Move to draft" : "Publish policy"}</Button>}</div>}</article>; })}</div></div>}
      </Card>
      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={create} className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Create policy</h2><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Title<Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5" placeholder="e.g. Leave and attendance policy" /></label><label className="block text-sm font-medium">Policy content<RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit">Create policy</Button></div></form></div>}
    </div>
  );
}
