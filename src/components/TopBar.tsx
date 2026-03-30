'use client';

import StatusBadge from './StatusBadge';

interface LupeStatus {
  status: 'active' | 'idle' | 'error';
  current_task: string;
}

interface TopBarProps {
  lupeStatus: LupeStatus | null;
  onMenuToggle: () => void;
}

export default function TopBar({ lupeStatus, onMenuToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-800/50 bg-black/90 px-4 backdrop-blur-md lg:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-lg font-black text-white lg:hidden">
          <span className="mr-1.5">🐺</span>
          LUPE
        </span>
      </div>

      {/* Right: status */}
      <div className="flex items-center gap-3">
        <StatusBadge status={lupeStatus?.status ?? 'idle'} />
      </div>
    </header>
  );
}
