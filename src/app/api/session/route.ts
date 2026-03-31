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
      session_id,
      channel,
      model,
      summary,
      transcript,
      token_count,
      cost_usd,
      started_at,
      ended_at,
    } = body;

    const { error } = await supabase.from("sessions").insert({
      session_id,
      channel,
      model,
      summary,
      transcript,
      token_count,
      cost_usd,
      started_at,
      ended_at,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
