'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMemo } from 'react';

interface CostEntry {
  date: string;
  cost: number;
  model: string;
}

interface CostChartProps {
  data: CostEntry[];
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4': '#a855f7',
  'gpt-4o': '#c084fc',
  'gpt-4o-mini': '#d8b4fe',
  'claude-3-opus': '#f97316',
  'claude-3-sonnet': '#fb923c',
  'claude-3-haiku': '#fdba74',
  'claude-sonnet-4-20250514': '#fb923c',
  'claude-opus-4-20250514': '#f97316',
};

function getColor(model: string, index: number): string {
  if (MODEL_COLORS[model]) return MODEL_COLORS[model];
  const fallback = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];
  return fallback[index % fallback.length];
}

export default function CostChart({ data }: CostChartProps) {
  const { chartData, models } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    const modelSet = new Set<string>();

    for (const entry of data) {
      modelSet.add(entry.model);
      const existing = dateMap.get(entry.date) ?? {};
      existing[entry.model] = (existing[entry.model] ?? 0) + entry.cost;
      dateMap.set(entry.date, existing);
    }

    const models = Array.from(modelSet);
    const chartData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costs]) => ({ date, ...costs }));

    return { chartData, models };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Daily Costs
        </h3>
        <p className="text-sm text-gray-500">No cost data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Daily Costs
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
              fontSize: '0.75rem',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`$${Number(value).toFixed(4)}`, undefined]}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.75rem', color: '#9ca3af' }}
          />
          {models.map((model, i) => (
            <Bar
              key={model}
              dataKey={model}
              stackId="cost"
              fill={getColor(model, i)}
              radius={i === models.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
