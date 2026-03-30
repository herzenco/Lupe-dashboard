interface HealthData {
  gateway_status: string;
  mac_uptime_seconds: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  telegram_status: string;
  drive_sync_status: string;
  error_log: string[];
}

interface HealthGridProps {
  health: HealthData;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'ok' || s === 'healthy' || s === 'connected' || s === 'synced') return 'text-green-400';
  if (s === 'degraded' || s === 'warning' || s === 'syncing') return 'text-yellow-400';
  return 'text-red-400';
}

function statusDot(status: string): string {
  const s = status.toLowerCase();
  if (s === 'ok' || s === 'healthy' || s === 'connected' || s === 'synced') return 'bg-green-400';
  if (s === 'degraded' || s === 'warning' || s === 'syncing') return 'bg-yellow-400';
  return 'bg-red-400';
}

function progressColor(percent: number): string {
  if (percent < 60) return 'bg-green-400';
  if (percent < 85) return 'bg-yellow-400';
  return 'bg-red-400';
}

function ProgressBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${progressColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusDot(value)}`} />
        <span className={`text-sm font-semibold ${statusColor(value)}`}>{value}</span>
      </div>
    </div>
  );
}

export default function HealthGrid({ health }: HealthGridProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        System Health
      </h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatusCard label="Gateway" value={health.gateway_status} />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm font-medium text-gray-400">Uptime</span>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatUptime(health.mac_uptime_seconds)}
          </p>
        </div>
        <ProgressBar label="CPU" percent={health.cpu_percent} />
        <ProgressBar label="Memory" percent={health.memory_percent} />
        <ProgressBar label="Disk" percent={health.disk_percent} />
        <StatusCard label="Telegram" value={health.telegram_status} />
        <StatusCard label="Drive Sync" value={health.drive_sync_status} />
        {health.error_log.length > 0 && (
          <div className="col-span-2 rounded-xl border border-red-900/50 bg-gray-900 p-4 lg:col-span-3">
            <span className="text-sm font-medium text-red-400">Recent Errors</span>
            <ul className="mt-2 space-y-1">
              {health.error_log.slice(0, 5).map((err, i) => (
                <li key={i} className="truncate text-xs text-gray-400">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
