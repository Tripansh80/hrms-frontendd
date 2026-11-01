"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getApiBaseUrl } from "@/lib/api";
import { getTenantSlug } from "@/lib/host";

export default function NewImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");

  async function submit() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    const tenantSlug = getTenantSlug();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
    const response = await fetch(`${getApiBaseUrl()}/imports/employees`, {
      method: "POST",
      body: form,
      headers,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error?.message || "Upload failed");
      return;
    }
    router.push(`/imports/${(await response.json()).id}`);
  }

  return (
    <main className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Import employees</h1>
      <p className="text-sm text-muted-foreground">
        Upload CSV or XLSX. Every invalid row is retained in the error summary; valid rows are never silently discarded.
      </p>
      <input type="file" accept=".csv,.xlsx,.xlsm" onChange={(e) => setFile(e.target.files?.[0])} />
      {error && <p className="rounded-lg border border-red-300 p-3 text-sm text-red-700">{error}</p>}
      <button
        className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white disabled:opacity-50"
        disabled={!file}
        onClick={submit}
      >
        Upload and validate
      </button>
    </main>
  );
}
