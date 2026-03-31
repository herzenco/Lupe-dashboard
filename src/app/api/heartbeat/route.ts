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
    const { status, session_type, current_task, current_model } = body;

    const { error } = await supabase.from("heartbeats").insert({
      status,
      session_type,
      current_task,
      current_model,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as Error & { message?: string; code?: string; details?: string };
    console.error("Heartbeat error:", error);
    return NextResponse.json(
      { error: err?.message || "Internal server error", code: err?.code, details: err?.details },
      { status: 500 }
    );
  }
}
