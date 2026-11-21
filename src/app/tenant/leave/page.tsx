"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock3, FileText, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/authStore";

type LeaveType = {
  id: string;
  name: string;
  code: string;
  unit: string;
  is_paid: boolean;
  rules_json?: Record<string, number | boolean>;
};
type LeaveBalance = {
  leave_type_id: string;
  employee_id: string;
  employee_name: string;
  name: string;
  code: string;
  unit: string;
  is_paid: boolean;
  allocated: number;
  used: number;
  pending: number;
  available: number;
};
type LeaveRequest = {
  id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  current_approver_id: string | null;
  employee_id: string;
  first_name: string;
  last_name: string;
};
type Notification = {
  id: string;
  type: string;
  payload_json: Record<string, string>;
  status: string;
  created_at: string;
};
type LeaveApprover = {
  id: string;
  full_name: string;
  email: string;
  role_name: string;
};

const statusStyles = {
  pending: "bg-warning-soft text-warning",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
  cancelled: "bg-muted text-muted-foreground",
};

export default function LeavePage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [approvers, setApprovers] = useState<LeaveApprover[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ leave_type_id: "", approver_user_id: "", start_date: "", end_date: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policySaving, setPolicySaving] = useState<string | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [requestResponse, typeResponse, balanceResponse, notificationResponse, approverResponse] = await Promise.all([
        api<{ items: LeaveRequest[] }>("GET", "/leave/requests"),
        api<{ items: LeaveType[] }>("GET", "/leave/types"),
        api<{ items: LeaveBalance[] }>("GET", `/leave/balances?year=${new Date().getFullYear()}`),
        api<{ items: Notification[] }>("GET", "/notifications?unread_only=true"),
        api<{ items: LeaveApprover[] }>("GET", "/leave/approvers"),
      ]);
      setRequests(requestResponse.items);
      setTypes(typeResponse.items);
      setBalances(balanceResponse.items);
      setNotifications(notificationResponse.items);
      setApprovers(approverResponse.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === "pending").length,
    approved: requests.filter((request) => request.status === "approved").length,
    days: requests.filter((request) => request.status === "approved").reduce((sum, request) => sum + Number(request.days), 0),
  }), [requests]);
  const isOwner = user?.roles.some((role) => role.toLowerCase().includes("owner")) ?? false;
  const canManagePolicy = user?.permissions.includes("tenant.update") ?? false;
  const ownerBalances = isOwner && balances.some((balance) => balance.employee_id);
  const employeeGroups = useMemo(() => {
    const groups = new Map<string, { name: string; balances: LeaveBalance[] }>();
    balances.forEach((balance) => {
      const current = groups.get(balance.employee_id);
      if (current) current.balances.push(balance);
      else groups.set(balance.employee_id, { name: balance.employee_name, balances: [balance] });
    });
    return Array.from(groups.entries());
  }, [balances]);
  const allEmployeesExpanded = employeeGroups.length > 0 && employeeGroups.every(([id]) => expandedEmployees[id]);

  const toggleAllEmployees = (expanded: boolean) => {
    setExpandedEmployees(Object.fromEntries(employeeGroups.map(([id]) => [id, expanded])));
  };

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const request = await api<LeaveRequest>("POST", "/leave/requests", {
        ...form,
        reason: form.reason.trim() || null,
      });
      setRequests((current) => [request, ...current]);
      setForm({ leave_type_id: "", approver_user_id: "", start_date: "", end_date: "", reason: "" });
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit leave request.");
    } finally {
      setSaving(false);
    }
  };

  const markNotificationRead = async (notification: Notification) => {
    try {
      await api("POST", `/notifications/${notification.id}/read`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notification as read.");
    }
  };

  const decideRequest = async (request: LeaveRequest, decision: "approve" | "reject") => {
    try {
      const saved = await api<LeaveRequest>("POST", `/leave/requests/${request.id}/${decision}`, {});
      setRequests((current) => current.map((item) => item.id === saved.id ? saved : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the leave request.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Leave" description={isOwner ? "Review employee leave usage and manage leave policies." : "Request time off and track your leave history."} primaryAction={!isOwner ? <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Request leave</Button> : undefined} />
      {error && <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={counts.pending} sub="Awaiting approval" />
        <StatCard label="Approved requests" value={counts.approved} sub="Approved time off" />
        <StatCard label="Approved days" value={counts.days} sub="Total approved days" />
      </div>

      <Card className="mb-6 p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold">{ownerBalances ? "Employee leave usage" : "My leave balance"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ownerBalances ? "Allocated, taken, and pending leave across your employees." : `Current allocation and usage for ${new Date().getFullYear()}`}</p>
          </div>
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading balances...</p>
        ) : balances.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No leave balances are available yet.</p>
        ) : (
          <div className={ownerBalances ? "space-y-3 p-5" : "grid gap-4 p-5 md:grid-cols-3"}>
            {ownerBalances && <div className="mb-2 flex justify-end"><Button type="button" variant="secondary" onClick={() => toggleAllEmployees(!allEmployeesExpanded)}>{allEmployeesExpanded ? "Collapse all" : "Expand all"}</Button></div>}
            {ownerBalances ? employeeGroups.map(([employeeId, group]) => {
              const expanded = Boolean(expandedEmployees[employeeId]);
              return <div key={employeeId} className="overflow-hidden rounded-xl border border-border bg-surface">
                <button type="button" onClick={() => setExpandedEmployees((current) => ({ ...current, [employeeId]: !expanded }))} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted">
                  <span className="font-semibold">{group.name}</span>
                  {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                {expanded && <div className="overflow-x-auto border-t border-border">
                  <div className="grid min-w-[600px] grid-cols-5 gap-3 px-5 py-3 text-xs font-semibold text-muted-foreground"><span>Leave type</span><span>Allocated</span><span>Taken</span><span>Pending</span><span>Remaining</span></div>
                  {group.balances.map((balance) => <div key={balance.leave_type_id} className="grid min-w-[600px] grid-cols-5 gap-3 border-t border-border px-5 py-3 text-sm"><span>{balance.name}</span><span>{Number(balance.allocated)}</span><span>{Number(balance.used)}</span><span>{Number(balance.pending)}</span><span className="font-semibold text-primary">{Number(balance.available)}</span></div>)}
                </div>}
              </div>;
            }) : balances.map((balance) => {
              const allocated = Number(balance.allocated);
              const used = Number(balance.used);
              const pending = Number(balance.pending);
              const available = Number(balance.available);
              const usedPercent = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;
              return (
                <div key={`${balance.employee_id}-${balance.leave_type_id}`} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{balance.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{balance.code}</p>
                    </div>
                    <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
                      {available} remaining
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usedPercent}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Allocated</p><p className="mt-1 font-semibold">{allocated}</p></div>
                    <div><p className="text-muted-foreground">Taken</p><p className="mt-1 font-semibold">{used}</p></div>
                    <div><p className="text-muted-foreground">Pending</p><p className="mt-1 font-semibold">{pending}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {canManagePolicy && (
        <Card className="mb-6 p-0">
          <div className="border-b border-border p-5"><h2 className="font-semibold">Leave policies</h2><p className="mt-1 text-xs text-muted-foreground">Change allocation and request rules for employees.</p></div>
          <div className="divide-y divide-border">
            {types.map((type) => {
              const rules = type.rules_json || {};
              return <form key={type.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_repeat(3,1fr)_auto] md:items-end" onSubmit={async (event) => {
                event.preventDefault();
                setPolicySaving(type.id);
                try {
                  const formData = new FormData(event.currentTarget);
                  const saved = await api<LeaveType>("PATCH", `/leave/types/${type.id}`, {
                    annual_allocation: Number(formData.get("annual_allocation")),
                    min_notice_days: Number(formData.get("min_notice_days")),
                    max_consecutive_days: Number(formData.get("max_consecutive_days")),
                  });
                  setTypes((current) => current.map((item) => item.id === saved.id ? saved : item));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not update leave policy.");
                } finally {
                  setPolicySaving(null);
                }
              }}>
                <div><p className="font-medium">{type.name}</p><p className="text-xs text-muted-foreground">{type.code}</p></div>
                <label className="text-xs text-muted-foreground">Annual allocation<input name="annual_allocation" type="number" min="0" step="0.5" defaultValue={Number(rules.annual_allocation || 0)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" /></label>
                <label className="text-xs text-muted-foreground">Min notice days<input name="min_notice_days" type="number" min="0" defaultValue={Number(rules.min_notice_days || 0)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" /></label>
                <label className="text-xs text-muted-foreground">Max consecutive days<input name="max_consecutive_days" type="number" min="0" defaultValue={Number(rules.max_consecutive_days || 0)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" /></label>
                <Button type="submit" disabled={policySaving === type.id}>{policySaving === type.id ? "Saving..." : "Save"}</Button>
              </form>;
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-0">
          <div className="flex items-center gap-2 border-b border-border p-5"><Calendar className="h-5 w-5 text-primary" /><h2 className="font-semibold">{isOwner ? "Employee leave requests" : "My leave requests"}</h2></div>
          {loading ? <p className="p-8 text-sm text-muted-foreground">Loading leave requests...</p> : requests.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">No leave requests yet</h3><p className="mt-1 text-sm text-muted-foreground">Submit your first leave request to see it here.</p></div> : (
            <div className="divide-y divide-border">{requests.map((request) => <div key={request.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-medium">{request.leave_type_name}</p><p className="mt-1 text-sm text-muted-foreground">{request.first_name} {request.last_name} · {request.start_date} to {request.end_date} · {request.days} day(s)</p>{request.reason && <p className="mt-1 truncate text-xs text-muted-foreground">{request.reason}</p>}</div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[request.status]}`}>{request.status}</span>{user?.permissions.includes("leave.approve") && request.status === "pending" && (isOwner || request.current_approver_id === user.id) && <div className="flex gap-1"><button onClick={() => decideRequest(request, "approve")} className="rounded-lg px-2 py-1 text-xs font-medium text-success hover:bg-success-soft">Approve</button><button onClick={() => decideRequest(request, "reject")} className="rounded-lg px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft">Reject</button></div>}</div>)}</div>
          )}
        </Card>

        <Card className="p-0">
          <div className="flex items-center gap-2 border-b border-border p-5"><Clock3 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Notifications</h2>{notifications.length > 0 && <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{notifications.length}</span>}</div>
          {notifications.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No new leave notifications.</p> : <div className="divide-y divide-border">{notifications.map((notification) => <button key={notification.id} onClick={() => markNotificationRead(notification)} className="w-full p-4 text-left hover:bg-muted/50"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-medium">{notification.payload_json.leave_type || notification.type.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{notification.payload_json.message || "Your leave request status was updated."}</p><p className="mt-2 text-[11px] text-muted-foreground">Click to mark as read</p></div></div></button>)}</div>}
        </Card>
      </div>

      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><form onSubmit={submitRequest} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Request leave</h2><p className="mt-1 text-sm text-muted-foreground">Submit a request for manager approval.</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>      <div className="mt-5 space-y-4"><label className="block text-sm font-medium">Leave type<select required value={form.leave_type_id} onChange={(event) => setForm({ ...form, leave_type_id: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="">Select leave type</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.code})</option>)}</select></label><label className="block text-sm font-medium">Who should approve?<select required value={form.approver_user_id} onChange={(event) => setForm({ ...form, approver_user_id: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"><option value="">Select approver</option>{approvers.map((approver) => <option key={approver.id} value={approver.id}>{approver.full_name} ({approver.role_name})</option>)}</select><span className="mt-1 block text-xs font-normal text-muted-foreground">Only your department manager, HR, or company owner can approve leave.</span></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Start date<Input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="mt-1.5" /></label><label className="block text-sm font-medium">End date<Input required type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="mt-1.5" /></label></div><label className="block text-sm font-medium">Reason<span className="font-normal text-muted-foreground"> (optional)</span><textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} maxLength={2000} className="mt-1.5 min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit request"}</Button></div></form></div>}
    </div>
  );
}
