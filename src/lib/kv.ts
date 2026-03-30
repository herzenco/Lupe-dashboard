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

function isKvConfigured(): boolean {
  return !!(process.env.KV_URL || process.env.KV_REST_API_URL);
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export async function getLupeStatus(): Promise<LupeStatus | null> {
  if (!isKvConfigured()) return null;
  try {
    const kv = await getKv();
    return kv.get<LupeStatus>("lupe:status");
  } catch (e) {
    console.error("KV getLupeStatus error:", e);
    return null;
  }
}

export async function setLupeStatus(status: LupeStatus): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const kv = await getKv();
    await kv.set("lupe:status", status);
  } catch (e) {
    console.error("KV setLupeStatus error:", e);
  }
}

export async function getSystemHealth(): Promise<SystemHealthData | null> {
  if (!isKvConfigured()) return null;
  try {
    const kv = await getKv();
    return kv.get<SystemHealthData>("lupe:system-health");
  } catch (e) {
    console.error("KV getSystemHealth error:", e);
    return null;
  }
}

export async function setSystemHealth(
  health: SystemHealthData
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const kv = await getKv();
    await kv.set("lupe:system-health", health);
  } catch (e) {
    console.error("KV setSystemHealth error:", e);
  }
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!isKvConfigured()) return null;
  try {
    const kv = await getKv();
    return kv.get<T>(key);
  } catch (e) {
    console.error(`KV get error for ${key}:`, e);
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    const kv = await getKv();
    await kv.set(key, value);
  } catch (e) {
    console.error(`KV set error for ${key}:`, e);
  }
}
