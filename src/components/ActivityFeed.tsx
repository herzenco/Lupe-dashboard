'use client';

interface Activity {
  id: string;
  action: string;
  detail: string;
  model: string;
  cost_usd: number | null;
  created_at: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const modelColors: Record<string, string> = {
  'gpt-4': 'bg-purple-500/20 text-purple-300',
  'gpt-4o': 'bg-purple-500/20 text-purple-300',
  'gpt-4o-mini': 'bg-purple-500/20 text-purple-300',
  'claude-3-opus': 'bg-orange-500/20 text-orange-300',
  'claude-3-sonnet': 'bg-orange-500/20 text-orange-300',
  'claude-3-haiku': 'bg-orange-500/20 text-orange-300',
  'claude-sonnet-4-20250514': 'bg-orange-500/20 text-orange-300',
  'claude-opus-4-20250514': 'bg-orange-500/20 text-orange-300',
};

function getModelColor(model: string): string {
  return modelColors[model] ?? 'bg-gray-700/50 text-gray-300';
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Activity Feed
        </h3>
        <p className="text-sm text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Activity Feed
      </h3>
      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-gray-800/50 bg-gray-800/30 p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{activity.action}</span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getModelColor(
                    activity.model
                  )}`}
                >
                  {activity.model}
                </span>
                {activity.cost_usd != null && activity.cost_usd > 0 && (
                  <span className="text-xs text-green-400">
                    ${activity.cost_usd.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-gray-400">{activity.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {relativeTime(activity.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
