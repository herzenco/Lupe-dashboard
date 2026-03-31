import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateLupeApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

    const { error } = await supabase.from("system_health").insert({
      gateway_status,
      gateway_uptime_seconds,
      mac_uptime_seconds,
      cpu_percent,
      memory_percent,
      disk_percent,
      telegram_status,
      drive_sync_status,
      error_log: error_log || [],
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("System health error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
