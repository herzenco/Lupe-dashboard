import { kv } from "@vercel/kv";

export { kv };

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

export async function getLupeStatus(): Promise<LupeStatus | null> {
  return kv.get<LupeStatus>("lupe:status");
}

export async function setLupeStatus(status: LupeStatus): Promise<void> {
  await kv.set("lupe:status", status);
}

export async function getSystemHealth(): Promise<SystemHealthData | null> {
  return kv.get<SystemHealthData>("lupe:system-health");
}

export async function setSystemHealth(
  health: SystemHealthData
): Promise<void> {
  await kv.set("lupe:system-health", health);
}
