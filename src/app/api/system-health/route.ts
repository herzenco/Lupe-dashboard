import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateLupeApiKey } from "@/lib/auth";
import { setSystemHealth } from "@/lib/kv";

export async function POST(request: NextRequest) {
  if (!validateLupeApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      gateway_status,
      gateway_uptime_seconds,
      mac_uptime_seconds,
      cpu_percent,
      memory_percent,
      disk_percent,
      telegram_status,
      drive_sync_status,
      error_log,
    } = body;

    await sql`
      INSERT INTO system_health (
        gateway_status, gateway_uptime_seconds, mac_uptime_seconds,
        cpu_percent, memory_percent, disk_percent,
        telegram_status, drive_sync_status, error_log
      )
      VALUES (
        ${gateway_status}, ${gateway_uptime_seconds}, ${mac_uptime_seconds},
        ${cpu_percent}, ${memory_percent}, ${disk_percent},
        ${telegram_status}, ${drive_sync_status}, ${JSON.stringify(error_log || [])}
      )
    `;

    await setSystemHealth({
      gateway_status,
      gateway_uptime_seconds,
      mac_uptime_seconds,
      cpu_percent,
      memory_percent,
      disk_percent,
      telegram_status,
      drive_sync_status,
      error_log: error_log || [],
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("System health error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
