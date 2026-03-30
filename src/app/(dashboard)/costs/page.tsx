"use client";

import { useState, useEffect, useMemo } from "react";
import BudgetBar from "@/components/BudgetBar";
import CostChart from "@/components/CostChart";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DailyEntry {
  date: string;
  model: string;
  cost_usd: number;
  tokens_in: number;
  tokens_out: number;
  session_count: number;
}

interface CostData {
  month: string;
  daily: DailyEntry[];
  totals: {
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    sessions: number;
  };
  projection: {
    daily_avg: number;
    month_projected: number;
    days_in_month: number;
    days_with_data: number;
  };
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function prevMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CostsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<CostData | null>(null);
  const [prevData, setPrevData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const prev = prevMonth(month);

    Promise.all([
      fetch(`/api/costs?month=${month}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/costs?month=${prev}`).then((r) => r.ok ? r.json() : null),
    ]).then(([current, previous]) => {
      if (cancelled) return;
      setData(current);
      setPrevData(previous);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [month]);

  const modelBreakdown = useMemo(() => {
    if (!data?.daily?.length) return [];
    const map = new Map<string, number>();
    for (const entry of data.daily) {
      map.set(entry.model, (map.get(entry.model) ?? 0) + Number(entry.cost_usd));
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([model, cost]) => ({
        model,
        cost,
        percentage: total > 0 ? (cost / total) * 100 : 0,
      }));
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.daily?.length) return [];
    return data.daily.map((d) => ({
      date: d.date,
      model: d.model,
      cost: Number(d.cost_usd),
    }));
  }, [data]);

  const totalCost = data?.totals?.cost_usd ?? 0;
  const projected = data?.projection?.month_projected ?? 0;

  const vsLastMonth = useMemo(() => {
    if (!prevData?.totals?.cost_usd || prevData.totals.cost_usd === 0) return null;
    const diff = totalCost - prevData.totals.cost_usd;
    const pct = (diff / prevData.totals.cost_usd) * 100;
    return { diff, pct };
  }, [totalCost, prevData]);

  const MODEL_BAR_COLORS = [
    "bg-purple-500",
    "bg-orange-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-yellow-500",
  ];

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cost Tracker</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            &larr;
          </button>
          <span className="min-w-[160px] text-center text-sm font-medium text-white">
            {formatMonth(month)}
          </span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Top stats row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <BudgetBar spent={totalCost} budget={150} />

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Monthly Spend
              </h3>
              <p className="mt-3 text-3xl font-bold text-white">
                ${totalCost.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {data?.totals?.sessions ?? 0} sessions
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Projected
              </h3>
              <p className="mt-3 text-3xl font-bold text-white">
                ${projected.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                ${data?.projection?.daily_avg.toFixed(2) ?? "0.00"}/day avg &middot;{" "}
                {data?.projection?.days_with_data ?? 0}/{data?.projection?.days_in_month ?? 0} days
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                vs Last Month
              </h3>
              {vsLastMonth ? (
                <>
                  <p
                    className={`mt-3 text-3xl font-bold ${
                      vsLastMonth.diff >= 0 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {vsLastMonth.diff >= 0 ? "+" : ""}${vsLastMonth.diff.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {vsLastMonth.pct >= 0 ? "+" : ""}
                    {vsLastMonth.pct.toFixed(1)}% from {formatMonth(prevMonth(month))}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-bold text-gray-500">&mdash;</p>
                  <p className="mt-1 text-xs text-gray-500">No previous data</p>
                </>
              )}
            </div>
          </div>

          {/* Daily cost chart */}
          <CostChart data={chartData} />

          {/* Model breakdown */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Model Breakdown
            </h3>
            {modelBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No data for this month</p>
            ) : (
              <div className="space-y-3">
                {modelBreakdown.map((m, i) => (
                  <div key={m.model}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-200">{m.model}</span>
                      <span className="text-gray-400">
                        ${m.cost.toFixed(2)} ({m.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={`h-full rounded-full ${
                          MODEL_BAR_COLORS[i % MODEL_BAR_COLORS.length]
                        }`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Cost Details
            </h3>
            {data?.daily?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Model</th>
                      <th className="pb-3 pr-4 font-medium text-right">Tokens In</th>
                      <th className="pb-3 pr-4 font-medium text-right">Tokens Out</th>
                      <th className="pb-3 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((row, i) => (
                      <tr
                        key={`${row.date}-${row.model}-${i}`}
                        className={`border-b border-gray-800/50 ${
                          i % 2 === 0 ? "bg-gray-900" : "bg-gray-950"
                        }`}
                      >
                        <td className="py-2.5 pr-4 text-gray-300">{row.date}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{row.model}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-400">
                          {Number(row.tokens_in).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-400">
                          {Number(row.tokens_out).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-medium text-gray-200">
                          ${Number(row.cost_usd).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No cost data for this month</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
