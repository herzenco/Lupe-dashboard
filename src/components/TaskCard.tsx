interface Task {
  id: string;
  name: string;
  status: string;
  priority: number;
  assignees: string[];
  due_date: string | null;
  workspace: string;
  list_name: string;
}

interface TaskCardProps {
  task: Task;
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  2: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  3: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  4: { label: 'Low', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task }: TaskCardProps) {
  const isClient = task.workspace === 'skydeo';
  const priority = priorityConfig[task.priority] ?? priorityConfig[3];

  return (
    <div
      className={`rounded-xl border bg-gray-900 p-4 transition-colors hover:bg-gray-800/80 ${
        isClient ? 'border-orange-500/50' : 'border-gray-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white leading-snug">{task.name}</h4>
        <div className="flex shrink-0 items-center gap-2">
          {isClient && (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
              CLIENT
            </span>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priority.color}`}
          >
            {priority.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span className="rounded bg-gray-800 px-2 py-0.5">{task.status}</span>
        <span className="text-gray-600">{task.list_name}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-500">
          {task.assignees.length > 0 && (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
              </svg>
              <span>{task.assignees.join(', ')}</span>
            </>
          )}
        </div>
        {task.due_date && (
          <div className="flex items-center gap-1 text-gray-500">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
