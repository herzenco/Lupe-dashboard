interface StatusBadgeProps {
  status: 'active' | 'idle' | 'error';
}

const statusConfig = {
  active: { color: 'bg-green-400', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.6)]', text: 'text-green-400', label: 'Active' },
  idle: { color: 'bg-yellow-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.6)]', text: 'text-yellow-400', label: 'Idle' },
  error: { color: 'bg-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.6)]', text: 'text-red-400', label: 'Error' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-1.5">
      <span className="relative flex h-3 w-3">
        {status === 'active' && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`} />
        )}
        <span className={`relative inline-flex h-3 w-3 rounded-full ${config.color} ${config.glow}`} />
      </span>
      <span className={`text-sm font-black uppercase tracking-wider ${config.text}`}>{config.label}</span>
    </span>
  );
}
