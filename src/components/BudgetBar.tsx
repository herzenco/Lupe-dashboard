interface BudgetBarProps {
  spent: number;
  budget?: number;
}

export default function BudgetBar({ spent, budget = 150 }: BudgetBarProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const clampedPercent = Math.min(percentage, 100);

  let barColor = 'bg-green-400';
  let textColor = 'text-green-400';
  if (percentage > 90) {
    barColor = 'bg-red-400';
    textColor = 'text-red-400';
  } else if (percentage > 75) {
    barColor = 'bg-yellow-400';
    textColor = 'text-yellow-400';
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Monthly Budget
        </h3>
        <span className={`text-sm font-semibold ${textColor}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-white font-medium">${spent.toFixed(2)}</span>
        <span className="text-gray-500">/ ${budget.toFixed(2)}</span>
      </div>
    </div>
  );
}
