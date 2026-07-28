"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import {
  FileText,
  Lock,
  LogOut,
  Radio,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { subscribePresenceCount } from "@/lib/presence";
import { CATEGORY_CONFIG, STATUS_CONFIG, type Report, type ReportCategory, type ReportStatus } from "@/types/report";

type AuthState = "loading" | "unauthenticated" | "authenticated" | "error";

interface AdminLogin {
  id: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [reports, setReports] = useState<Report[]>([]);
  const [logins, setLogins] = useState<AdminLogin[]>([]);
  const [loginsTotal, setLoginsTotal] = useState(0);
  const [onlineCount, setOnlineCount] = useState(1);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (res.ok) {
        setReports(await res.json());
        setAuthState("authenticated");
        return;
      }
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? `Request failed (${res.status})`);
      setAuthState("error");
    } catch {
      setServerError("Network error — is the server running?");
      setAuthState("error");
    }
  };

  const loadLogins = async () => {
    try {
      const res = await fetch("/api/admin/logins");
      if (res.ok) {
        const body = await res.json();
        setLogins(body.logins ?? []);
        setLoginsTotal(body.total ?? 0);
      }
    } catch {
      // Non-critical — the dashboard still works without login history.
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial auth check + data load
    loadReports();
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load once authenticated
    loadLogins();

    // Live "people on the site now" — counts every open tab across the site
    // via the shared Supabase Realtime Presence channel (this admin tab included).
    const unsubscribe = subscribePresenceCount(setOnlineCount);
    return unsubscribe;
  }, [authState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        await loadReports();
      } else {
        setLoginError("Incorrect password.");
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setReports([]);
    setAuthState("unauthenticated");
  };

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    const prev = reports;
    setBusy(id, true);
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setReports(prev);
    } catch {
      setReports(prev);
    } finally {
      setBusy(id, false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report permanently? This can't be undone.")) return;
    const prev = reports;
    setBusy(id, true);
    setReports((rs) => rs.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      if (!res.ok) setReports(prev);
    } catch {
      setReports(prev);
    } finally {
      setBusy(id, false);
    }
  };

  const filtered = useMemo(() => {
    let list = reports;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.address?.toLowerCase().includes(q) ?? false) ||
          (r.reporter_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [reports, search, statusFilter]);

  const stats = useMemo(() => {
    const byStatus = { pending: 0, in_progress: 0, resolved: 0 };
    const byCategory = new Map<ReportCategory, number>(
      (Object.keys(CATEGORY_CONFIG) as ReportCategory[]).map((c) => [c, 0])
    );
    let totalVotes = 0;

    for (const r of reports) {
      byStatus[r.status] += 1;
      byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
      totalVotes += (r.fixed_votes ?? 0) + (r.not_fixed_votes ?? 0);
    }

    const categoryBreakdown = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const maxCategoryCount = Math.max(1, ...categoryBreakdown.map(([, n]) => n));

    return { byStatus, categoryBreakdown, maxCategoryCount, totalVotes };
  }, [reports]);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-red-200 shadow-lg space-y-2">
          <h1 className="font-poppins font-bold text-red-600 text-lg">Server error</h1>
          <p className="text-sm text-gray-600">{serverError}</p>
          <p className="text-xs text-gray-400">
            If this mentions SUPABASE_SERVICE_ROLE_KEY, it needs to be set in .env.local.
          </p>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm p-6 rounded-2xl bg-white border border-gray-200 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="font-poppins font-bold text-gray-900 text-lg leading-tight">Admin</h1>
              <p className="text-xs text-gray-500">fama-mochkla</p>
            </div>
          </div>
          <input
            type="password"
            autoFocus
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
          />
          {loginError && <p className="text-xs text-red-500">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn || !password}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {loggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-poppins font-bold text-gray-900 text-lg">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">{reports.length} total reports</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Total reports</span>
            </div>
            <span className="font-poppins font-black text-2xl text-gray-900">{reports.length}</span>
          </div>
          <div className="p-4 rounded-2xl border border-green-200 bg-green-50">
            <div className="flex items-center gap-1.5 text-green-600 mb-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Online now</span>
            </div>
            <span className="font-poppins font-black text-2xl text-gray-900">{onlineCount}</span>
          </div>
          <div className="p-4 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Admin logins</span>
            </div>
            <span className="font-poppins font-black text-2xl text-gray-900">{loginsTotal}</span>
          </div>
          <div className="p-4 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Votes cast</span>
            </div>
            <span className="font-poppins font-black text-2xl text-gray-900">{stats.totalVotes}</span>
          </div>
          {(["pending", "in_progress", "resolved"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">{cfg.label}</span>
                </div>
                <span className="font-poppins font-black text-2xl text-gray-900">{stats.byStatus[s]}</span>
              </div>
            );
          })}
        </div>

        {/* Category breakdown + Recent admin logins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Reports by category
            </h2>
            <div className="space-y-3">
              {stats.categoryBreakdown.map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat];
                const pct = (count / stats.maxCategoryCount) * 100;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <span>{cfg.emoji}</span>
                      <span className="truncate">{cfg.label}</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500/80"
                        style={{ width: count > 0 ? `${Math.max(pct, 3)}%` : "0%" }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-semibold text-gray-500 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Recent admin logins ({loginsTotal} total)
            </h2>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {logins.length === 0 && <p className="text-xs text-gray-400">No login history yet.</p>}
              {logins.map((login) => (
                <div key={login.id} className="flex items-center justify-between gap-3 text-xs border-b border-gray-100 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="text-gray-700 font-medium">{login.ip_address ?? "Unknown IP"}</p>
                    <p className="text-gray-400 truncate max-w-[220px]">{login.user_agent ?? "Unknown device"}</p>
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {formatDistanceToNow(new Date(login.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, address, reporter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-modern h-10 rounded-xl border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-900 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Report list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-16 text-sm">No reports match.</p>
          )}
          {filtered.map((report) => {
            const catCfg = CATEGORY_CONFIG[report.category];
            const busy = busyIds.has(report.id);
            return (
              <div
                key={report.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 transition-opacity ${busy ? "opacity-50" : ""}`}
              >
                <div className="relative w-full sm:w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {report.photo_url ? (
                    <Image src={report.photo_url} alt={report.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">{catCfg.emoji}</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catCfg.color}`}>
                      {catCfg.emoji} {catCfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{format(new Date(report.created_at), "PP p")}</span>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 truncate">{report.title}</p>
                  {report.address && <p className="text-xs text-gray-500 truncate">{report.address}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {report.fixed_votes ?? 0}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> {report.not_fixed_votes ?? 0}</span>
                    {report.reporter_name && <span>by {report.reporter_name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={report.status}
                    disabled={busy}
                    onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                    className={`select-modern h-9 rounded-xl border px-3 pr-8 text-xs font-semibold focus:outline-none appearance-none cursor-pointer disabled:cursor-not-allowed ${STATUS_CONFIG[report.status].color}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={busy}
                    aria-label="Delete report"
                    className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 disabled:cursor-not-allowed flex items-center justify-center text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
