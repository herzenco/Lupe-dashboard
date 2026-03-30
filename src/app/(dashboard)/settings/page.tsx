"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncResult {
  success: boolean;
  message?: string;
}

// ─── Settings Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  // API Key — hardcoded placeholder; in production, fetch from env/API
  const apiKey = process.env.NEXT_PUBLIC_LUPE_API_KEY ?? "lupe_xxxx••••••••xxxx";
  const maskedKey =
    apiKey.length > 8
      ? `${apiKey.slice(0, 4)}${"••••••••"}${apiKey.slice(-4)}`
      : "••••••••••••";

  const [keyCopied, setKeyCopied] = useState(false);

  // ClickUp sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [registeringWebhooks, setRegisteringWebhooks] = useState(false);
  const [webhookResult, setWebhookResult] = useState<SyncResult | null>(null);

  // Budget
  const [budget, setBudget] = useState("150");
  const [budgetSaved, setBudgetSaved] = useState(false);

  // Database
  const [initializingDb, setInitializingDb] = useState(false);
  const [dbResult, setDbResult] = useState<SyncResult | null>(null);

  // Danger zone
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [dangerLoading, setDangerLoading] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────

  async function copyApiKey() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  }

  async function syncClickUp() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/tasks/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult({
        success: res.ok,
        message: data.message ?? (res.ok ? "Sync completed" : "Sync failed"),
      });
    } catch {
      setSyncResult({ success: false, message: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  async function registerWebhooks() {
    setRegisteringWebhooks(true);
    setWebhookResult(null);
    try {
      const res = await fetch("/api/setup/clickup-webhooks", {
        method: "POST",
      });
      const data = await res.json();
      setWebhookResult({
        success: res.ok,
        message:
          data.message ?? (res.ok ? "Webhooks registered" : "Registration failed"),
      });
    } catch {
      setWebhookResult({ success: false, message: "Network error" });
    } finally {
      setRegisteringWebhooks(false);
    }
  }

  function saveBudget() {
    // For now, just show confirmation — budget is hardcoded at $150
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }

  async function initializeDatabase() {
    setInitializingDb(true);
    setDbResult(null);
    try {
      const res = await fetch("/api/setup/database", { method: "POST" });
      const data = await res.json();
      setDbResult({
        success: res.ok,
        message:
          data.message ??
          (res.ok ? "Database initialized" : "Initialization failed"),
      });
    } catch {
      setDbResult({ success: false, message: "Network error" });
    } finally {
      setInitializingDb(false);
    }
  }

  async function executeDangerAction(action: string) {
    setDangerLoading(true);
    try {
      const endpoint =
        action === "clear-sessions"
          ? "/api/sessions/clear"
          : "/api/activity/reset";
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        alert(
          action === "clear-sessions"
            ? "All sessions cleared."
            : "Activity log reset."
        );
      } else {
        alert("Action failed. Check server logs.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDangerLoading(false);
      setConfirmAction(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your Lupe Command Center configuration
        </p>
      </div>

      {/* ── API Key ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-400">
          API Key
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Lupe API Key — use this in Lupe&apos;s .env.secrets
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 font-mono text-sm text-gray-300">
            {maskedKey}
          </code>
          <button
            onClick={copyApiKey}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
          >
            {keyCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── ClickUp Sync ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          ClickUp Sync
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Last synced:</span>
            <span className="text-gray-300">Unknown</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={syncClickUp}
              disabled={syncing}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Syncing...
                </span>
              ) : (
                "Sync Now"
              )}
            </button>

            <button
              onClick={registerWebhooks}
              disabled={registeringWebhooks}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {registeringWebhooks ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Registering...
                </span>
              ) : (
                "Register Webhooks"
              )}
            </button>
          </div>

          {/* Result messages */}
          {syncResult && (
            <p
              className={`text-sm ${
                syncResult.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {syncResult.message}
            </p>
          )}
          {webhookResult && (
            <p
              className={`text-sm ${
                webhookResult.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {webhookResult.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Budget ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Budget
        </h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Current monthly budget
            </label>
            <div className="flex items-center">
              <span className="rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400">
                $
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-28 rounded-r-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={saveBudget}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
          >
            {budgetSaved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Database ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Database
        </h2>
        <button
          onClick={initializeDatabase}
          disabled={initializingDb}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {initializingDb ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              Initializing...
            </span>
          ) : (
            "Initialize Database"
          )}
        </button>
        <p className="mt-2 text-xs text-yellow-500/80">
          Only run this on first deploy
        </p>
        {dbResult && (
          <p
            className={`mt-2 text-sm ${
              dbResult.success ? "text-green-400" : "text-red-400"
            }`}
          >
            {dbResult.message}
          </p>
        )}
      </div>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-red-900/50 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400">
          Danger Zone
        </h2>
        <div className="flex flex-wrap gap-3">
          {confirmAction === "clear-sessions" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-400">Are you sure?</span>
              <button
                onClick={() => executeDangerAction("clear-sessions")}
                disabled={dangerLoading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {dangerLoading ? "Clearing..." : "Yes, Clear"}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction("clear-sessions")}
              className="rounded-lg border border-red-800/50 bg-gray-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/30"
            >
              Clear All Sessions
            </button>
          )}

          {confirmAction === "reset-activity" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-400">Are you sure?</span>
              <button
                onClick={() => executeDangerAction("reset-activity")}
                disabled={dangerLoading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {dangerLoading ? "Resetting..." : "Yes, Reset"}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction("reset-activity")}
              className="rounded-lg border border-red-800/50 bg-gray-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/30"
            >
              Reset Activity Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
