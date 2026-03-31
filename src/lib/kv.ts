import { supabase } from "./supabase";

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

// Read latest heartbeat from Supabase
export async function getLupeStatus(): Promise<LupeStatus | null> {
  try {
    const { data, error } = await supabase
      .from("heartbeats")
      .select("status, session_type, current_task, current_model, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      status: data.status,
      session_type: data.session_type || "",
      current_task: data.current_task || "",
      current_model: data.current_model || "",
      last_heartbeat: data.created_at || new Date().toISOString(),
    };
  } catch (e) {
    console.error("getLupeStatus error:", e);
    return null;
  }
}

// No-op — heartbeat route already inserts into heartbeats table
export async function setLupeStatus(_status: LupeStatus): Promise<void> {
  // Data is already written to heartbeats table by the heartbeat route
}

// Read latest system health from Supabase
export async function getSystemHealth(): Promise<SystemHealthData | null> {
  try {
    const { data, error } = await supabase
      .from("system_health")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      gateway_status: data.gateway_status || "unknown",
      gateway_uptime_seconds: Number(data.gateway_uptime_seconds) || 0,
      mac_uptime_seconds: Number(data.mac_uptime_seconds) || 0,
      cpu_percent: Number(data.cpu_percent) || 0,
      memory_percent: Number(data.memory_percent) || 0,
      disk_percent: Number(data.disk_percent) || 0,
      telegram_status: data.telegram_status || "unknown",
      drive_sync_status: data.drive_sync_status || "unknown",
      error_log: data.error_log || [],
      updated_at: data.created_at || new Date().toISOString(),
    };
  } catch (e) {
    console.error("getSystemHealth error:", e);
    return null;
  }
}

// No-op — system-health route already inserts into system_health table
export async function setSystemHealth(
  _health: SystemHealthData
): Promise<void> {
  // Data is already written to system_health table by the system-health route
}

// Generic KV get — reads from kv_store table
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return null;
    return data.value as T;
  } catch (e) {
    console.error(`kvGet error for ${key}:`, e);
    return null;
  }
}

// Generic KV set — upserts into kv_store table
export async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    await supabase.from("kv_store").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (e) {
    console.error(`kvSet error for ${key}:`, e);
  }
}
