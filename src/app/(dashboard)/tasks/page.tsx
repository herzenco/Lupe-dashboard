"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import TaskCard from "@/components/TaskCard";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Task {
  id: string;
  name: string;
  status: string;
  priority: number;
  assignees: string[];
  due_date: string | null;
  workspace: string;
  list_name: string;
  space_name: string;
  url: string;
}

type ViewMode = "kanban" | "list";
type SortField = "name" | "status" | "priority" | "due_date" | "workspace";
type SortDir = "asc" | "desc";

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Urgent", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  2: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  3: { label: "Normal", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  4: { label: "Low", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const WORKSPACE_OPTIONS = ["all", "herzen-co", "skydeo"] as const;
const WORKSPACE_LABELS: Record<string, string> = {
  all: "All Workspaces",
  "herzen-co": "Herzen Co.",
  skydeo: "Skydeo",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [workspace, setWorkspace] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Detect mobile on mount for default view
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("list");
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (workspace !== "all") params.set("workspace", workspace);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [workspace, statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  // Derive unique statuses from tasks for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const set = new Set(tasks.map((t) => t.status));
    return Array.from(set).sort();
  }, [tasks]);

  // Apply client-side priority filter and sorting for list view
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (priorityFilter) {
      result = result.filter((t) => t.priority === Number(priorityFilter));
    }
    return result;
  }, [tasks, priorityFilter]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority":
          cmp = a.priority - b.priority;
          break;
        case "due_date":
          cmp =
            (a.due_date ? new Date(a.due_date).getTime() : Infinity) -
            (b.due_date ? new Date(b.due_date).getTime() : Infinity);
          break;
        case "workspace":
          cmp = a.workspace.localeCompare(b.workspace);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredTasks, sortField, sortDir]);

  // Group tasks by status for kanban
  const kanbanColumns = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const task of filteredTasks) {
      if (!groups[task.status]) groups[task.status] = [];
      groups[task.status].push(task);
    }
    // Define a preferred order, put unknown statuses at the end
    const preferredOrder = [
      "to do",
      "in progress",
      "review",
      "in review",
      "done",
      "complete",
      "closed",
    ];
    const keys = Object.keys(groups);
    keys.sort((a, b) => {
      const aIdx = preferredOrder.indexOf(a.toLowerCase());
      const bIdx = preferredOrder.indexOf(b.toLowerCase());
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
    return keys.map((status) => ({ status, tasks: groups[status] }));
  }, [filteredTasks]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  function handleTaskClick(task: Task) {
    if (task.url) {
      window.open(task.url, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-white">Tasks</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-700 bg-gray-800">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-primary-600 text-white"
                  : "text-gray-400 hover:text-white"
              } rounded-l-lg`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-primary-600 text-white"
                  : "text-gray-400 hover:text-white"
              } rounded-r-lg`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
        >
          {WORKSPACE_OPTIONS.map((ws) => (
            <option key={ws} value={ws}>
              {WORKSPACE_LABELS[ws]}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="1">Urgent</option>
          <option value="2">High</option>
          <option value="3">Normal</option>
          <option value="4">Low</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
        />
      </div>

      {/* Task count */}
      <p className="text-xs text-gray-500">
        {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
      </p>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks found</p>
          ) : (
            kanbanColumns.map((col) => (
              <div
                key={col.status}
                className="flex min-w-[300px] flex-shrink-0 flex-col rounded-xl border border-gray-800 bg-gray-900/50"
              >
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">
                    {col.status}
                  </h3>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {col.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="cursor-pointer"
                    >
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Title{sortIndicator("name")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Status{sortIndicator("status")}
                </th>
                <th
                  onClick={() => handleSort("priority")}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Priority{sortIndicator("priority")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Assignee
                </th>
                <th
                  onClick={() => handleSort("due_date")}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Due Date{sortIndicator("due_date")}
                </th>
                <th
                  onClick={() => handleSort("workspace")}
                  className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Workspace{sortIndicator("workspace")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const priority =
                    PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG[3];
                  const isSkydeo =
                    task.workspace?.toLowerCase() === "skydeo";

                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={`cursor-pointer transition-colors hover:bg-gray-800/50 ${
                        isSkydeo ? "border-l-2 border-l-orange-500" : ""
                      }`}
                    >
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-white">
                        {task.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priority.color}`}
                        >
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {task.assignees?.length > 0
                          ? task.assignees.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(task.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            isSkydeo ? "text-orange-400" : "text-gray-400"
                          }`}
                        >
                          {task.workspace}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Task creation form will be built here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
