"use client";

import { useState, useEffect, useCallback } from "react";
import SessionViewer from "@/components/SessionViewer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Session {
  id: number;
  session_id: string;
  channel: string;
  model: string;
  summary: string | null;
  token_count: number;
  cost_usd: number;
  started_at: string;
  ended_at: string | null;
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SessionDetail extends Session {
  transcript: TranscriptMessage[];
}

const CHANNEL_ICONS: Record<string, string> = {
  telegram: "\uD83D\uDCF1",
  tui: "\uD83D\uDCBB",
  webchat: "\uD83C\uDF10",
};

const CHANNEL_OPTIONS = ["All", "telegram", "tui", "webchat"] as const;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "ongoing";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function truncate(text: string | null, max: number): string {
  if (!text) return "No summary";
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [transcriptData, setTranscriptData] = useState<Record<number, TranscriptMessage[]>>({});
  const [transcriptLoading, setTranscriptLoading] = useState<number | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [channel, setChannel] = useState("All");
  const [search, setSearch] = useState("");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (channel !== "All") params.set("channel", channel);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (res.ok) {
        const data: Session[] = await res.json();
        setSessions(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, channel, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const toggleSession = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (!transcriptData[id]) {
      setTranscriptLoading(id);
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (res.ok) {
          const detail: SessionDetail = await res.json();
          setTranscriptData((prev) => ({
            ...prev,
            [id]: detail.transcript ?? [],
          }));
        }
      } catch {
        // silently fail
      } finally {
        setTranscriptLoading(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Sessions</h1>

      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
          >
            {CHANNEL_OPTIONS.map((ch) => (
              <option key={ch} value={ch}>
                {ch === "All" ? "All Channels" : ch.charAt(0).toUpperCase() + ch.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-400">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search summaries or session IDs..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <p className="text-gray-500">No sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id}>
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-colors hover:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  {/* Channel icon */}
                  <span className="mt-0.5 text-xl" title={session.channel}>
                    {CHANNEL_ICONS[session.channel] ?? "\u2753"}
                  </span>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">
                        {formatDateTime(session.started_at)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(session.started_at, session.ended_at)}
                      </span>
                      <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                        {session.model}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      {truncate(session.summary, 100)}
                    </p>
                  </div>

                  {/* Right side stats */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium text-gray-200">
                      ${Number(session.cost_usd).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Number(session.token_count).toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded transcript viewer */}
              {expandedId === session.id && (
                <div className="mt-2 ml-10">
                  {transcriptLoading === session.id ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : transcriptData[session.id] ? (
                    <SessionViewer transcript={transcriptData[session.id]} />
                  ) : (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                      <p className="text-sm text-gray-500">
                        No transcript available
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto-cleanup notice */}
      <p className="text-center text-xs text-gray-600">
        Transcripts are automatically deleted after 30 days
      </p>
    </div>
  );
}
