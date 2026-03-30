import { sql, rawQuery } from "./db";

export interface LupeStatus {
  status: "active" | "idle" | "error";
  session_type: string;
  current_task: string;
  current_model: string;
  last_heartbeat: string;
}

export interface SystemHealthData {
  gateway_status: string;
  gateway_uptime_seconds: number;
  mac_uptime_seconds: number;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  telegram_status: string;
  drive_sync_status: string;
  error_log: string[];
  updated_at: string;
}

// Read latest heartbeat from Postgres as the "cached" status
export async function getLupeStatus(): Promise<LupeStatus | null> {
  try {
    const result = await rawQuery(
      `SELECT status, session_type, current_task, current_model, created_at
       FROM heartbeats ORDER BY created_at DESC LIMIT 1`
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      status: row.status,
      session_type: row.session_type || "",
      current_task: row.current_task || "",
      current_model: row.current_model || "",
      last_heartbeat: row.created_at?.toISOString?.() || new Date().toISOString(),
    };
  } catch (e) {
    console.error("getLupeStatus error:", e);
    return null;
  }
}

// No-op — heartbeat route already inserts into heartbeats table
export async function setLupeStatus(_status: LupeStatus): Promise<void> {
  // Data is already written to heartbeats table by the heartbeat route
  // This function exists to maintain the interface
}

// Read latest system health from Postgres
export async function getSystemHealth(): Promise<SystemHealthData | null> {
  try {
    const result = await rawQuery(
      `SELECT * FROM system_health ORDER BY created_at DESC LIMIT 1`
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      gateway_status: row.gateway_status || "unknown",
      gateway_uptime_seconds: Number(row.gateway_uptime_seconds) || 0,
      mac_uptime_seconds: Number(row.mac_uptime_seconds) || 0,
      cpu_percent: Number(row.cpu_percent) || 0,
      memory_percent: Number(row.memory_percent) || 0,
      disk_percent: Number(row.disk_percent) || 0,
      telegram_status: row.telegram_status || "unknown",
      drive_sync_status: row.drive_sync_status || "unknown",
      error_log: row.error_log || [],
      updated_at: row.created_at?.toISOString?.() || new Date().toISOString(),
    };
  } catch (e) {
    console.error("getSystemHealth error:", e);
    return null;
  }
}

// No-op — system-health route already inserts into system_health table
export async function setSystemHealth(_health: SystemHealthData): Promise<void> {
  // Data is already written to system_health table by the system-health route
}

// Generic KV get — uses a kv_store table in Postgres
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const result = await sql`SELECT value FROM kv_store WHERE key = ${key}`;
    if (result.rows.length === 0) return null;
    return result.rows[0].value as T;
  } catch (e) {
    console.error(`kvGet error for ${key}:`, e);
    return null;
  }
}

// Generic KV set — upserts into kv_store table
export async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    await sql`
      INSERT INTO kv_store (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;
  } catch (e) {
    console.error(`kvSet error for ${key}:`, e);
  }
}
