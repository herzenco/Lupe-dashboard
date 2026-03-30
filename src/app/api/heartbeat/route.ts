import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateLupeApiKey } from "@/lib/auth";
import { setLupeStatus } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateLupeApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, session_type, current_task, current_model } = body;

    await sql`
      INSERT INTO heartbeats (status, session_type, current_task, current_model)
      VALUES (${status}, ${session_type}, ${current_task}, ${current_model})
    `;

    await setLupeStatus({
      status,
      session_type: session_type || "",
      current_task: current_task || "",
      current_model: current_model || "",
      last_heartbeat: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
