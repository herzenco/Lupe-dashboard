import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");

    let query = supabase
      .from("sessions")
      .select(
        "id, session_id, channel, model, summary, token_count, cost_usd, started_at, ended_at"
      )
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(100);

    if (from) {
      query = query.gte("started_at", from);
    }
    if (to) {
      query = query.lte("started_at", to);
    }
    if (channel) {
      query = query.eq("channel", channel);
    }
    if (search) {
      query = query.or(
        `summary.ilike.%${search}%,session_id.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Sessions list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
