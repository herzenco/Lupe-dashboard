"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import ActivityFeed from "@/components/ActivityFeed";
import HealthGrid from "@/components/HealthGrid";
import LoadingSpinner from "@/components/LoadingSpinner";

interface LupeStatus {
  status: "active" | "idle" | "error";
  session_type: string;
  current_task: string;
  current_model: string;
  last_heartbeat: string;
}

interface SystemHealth {
  gateway_status: string;
  gateway_uptime_seconds: number;
  mac_uptime_seconds: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  telegram_status: string;
  drive_sync_status: string;
  error_log: string[];
  updated_at: string;
}

interface Activity {
  id: string;
  action: string;
  detail: string;
  model: string;
  cost_usd: number | null;
  created_at: string;
}

interface CostEntry {
  date: string;
  cost: number;
  model: string;
}

interface CostData {
  daily: CostEntry[];
  totals: {
    cost_usd: number;
  };
  projection: {
    month_projected: number;
  };
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 0) return "now";
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function OverviewPage() {
  const [lupeStatus, setLupeStatus] = useState<LupeStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statusRes, activityRes, costsRes] = await Promise.all([
          fetch("/api/status"),
          fetch("/api/activity"),
          fetch(`/api/costs?month=${currentMonthString()}`),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.lupe) setLupeStatus(data.lupe);
          if (data.system) setSystemHealth(data.system);
        }

        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivities(Array.isArray(data) ? data : []);
        }

        if (costsRes.ok) {
          const data = await costsRes.json();
          setCostData(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const todaySpend =
    costData?.daily
      ?.filter((d) => d.date === todayDateString())
      .reduce((sum, d) => sum + (d.cost ?? 0), 0) ?? 0;

  const monthlySpend = costData?.totals?.cost_usd ?? 0;
  const budgetLimit = 150;
  const budgetRemaining = Math.max(budgetLimit - monthlySpend, 0);
  const budgetPercent = Math.min((monthlySpend / budgetLimit) * 100, 100);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statusColor =
    lupeStatus?.status === "active"
      ? "text-green-400"
      : lupeStatus?.status === "error"
      ? "text-red-400"
      : "text-yellow-400";

  const budgetColor =
    budgetPercent > 90
      ? "text-red-400"
      : budgetPercent > 75
      ? "text-yellow-400"
      : "text-green-400";

  const budgetBarColor =
    budgetPercent > 90
      ? "bg-red-500"
      : budgetPercent > 75
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-4">
          <div
            className={`h-5 w-5 rounded-full ${
              lupeStatus?.status === "active"
                ? "bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                : lupeStatus?.status === "error"
                ? "bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                : "bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]"
            }`}
          />
          <span className={`text-5xl font-black uppercase tracking-tight ${statusColor}`}>
            {lupeStatus?.status ?? "Offline"}
          </span>
        </div>
        {lupeStatus?.current_task && (
          <p className="mt-3 max-w-lg text-center text-lg text-gray-400">
            {lupeStatus.current_task}
          </p>
        )}
        {lupeStatus?.last_heartbeat && (
          <p className="mt-1 text-sm text-gray-600">
            {relativeTime(lupeStatus.last_heartbeat)} ago
          </p>
        )}
      </div>

      {/* Big numbers grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Today
          </p>
          <p className="mt-2 text-5xl font-black tabular-nums text-white">
            ${todaySpend.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            This Month
          </p>
          <p className="mt-2 text-5xl font-black tabular-nums text-white">
            ${monthlySpend.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Budget Left
          </p>
          <p className={`mt-2 text-5xl font-black tabular-nums ${budgetColor}`}>
            ${budgetRemaining.toFixed(0)}
          </p>
          {/* Mini budget bar */}
          <div className="mx-auto mt-3 h-2 w-3/4 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full transition-all ${budgetBarColor}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Tasks
          </p>
          <p className="mt-2 text-5xl font-black tabular-nums text-white">
            0
          </p>
        </div>
      </div>

      {/* System health - compact bold version */}
      {systemHealth ? (
        <div className="grid grid-cols-3 gap-3">
          <GaugeCard label="CPU" value={systemHealth.cpu_percent} unit="%" />
          <GaugeCard label="MEM" value={systemHealth.memory_percent} unit="%" />
          <GaugeCard label="DISK" value={systemHealth.disk_percent} unit="%" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <GaugeCard label="CPU" value={0} unit="%" />
          <GaugeCard label="MEM" value={0} unit="%" />
          <GaugeCard label="DISK" value={0} unit="%" />
        </div>
      )}

      {/* Status pills row */}
      <div className="flex flex-wrap justify-center gap-3">
        <StatusPill
          label="Gateway"
          status={systemHealth?.gateway_status ?? "unknown"}
        />
        <StatusPill
          label="Telegram"
          status={systemHealth?.telegram_status ?? "unknown"}
        />
        <StatusPill
          label="Drive"
          status={systemHealth?.drive_sync_status ?? "unknown"}
        />
        <StatusPill
          label="Model"
          status={lupeStatus?.current_model?.split("/").pop() ?? "—"}
          neutral
        />
      </div>

      {/* Activity feed */}
      {activities.length > 0 && <ActivityFeed activities={activities} />}
    </div>
  );
}

function GaugeCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const color =
    value > 90
      ? "text-red-400"
      : value > 70
      ? "text-yellow-400"
      : "text-primary-400";
  const barColor =
    value > 90
      ? "bg-red-500"
      : value > 70
      ? "bg-yellow-500"
      : "bg-primary-500";

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-black tabular-nums ${color}`}>
        {value.toFixed(0)}
        <span className="text-lg">{unit}</span>
      </p>
      <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatusPill({
  label,
  status,
  neutral = false,
}: {
  label: string;
  status: string;
  neutral?: boolean;
}) {
  const isGood =
    neutral ||
    ["running", "connected", "up-to-date", "syncing"].includes(status);
  const isError = ["stopped", "error", "disconnected"].includes(status);

  const dotColor = neutral
    ? "bg-primary-400"
    : isGood
    ? "bg-green-400"
    : isError
    ? "bg-red-400"
    : "bg-gray-500";

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-2">
      <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-white">
        {status}
      </span>
    </div>
  );
}
