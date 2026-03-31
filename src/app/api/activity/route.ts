import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateLupeApiKey, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!validateLupeApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, detail, model, tokens_in, tokens_out, cost_usd } = body;

    // Insert activity log
    const { error: activityError } = await supabase
      .from("activity_log")
      .insert({ action, detail, model, tokens_in, tokens_out, cost_usd });

    if (activityError) throw activityError;

    // Upsert daily costs (read-modify-write since we need to increment)
    const today = new Date().toISOString().split("T")[0];
    const modelName = model || "unknown";

    const { data: existing } = await supabase
      .from("daily_costs")
      .select("*")
      .eq("date", today)
      .eq("model", modelName)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("daily_costs")
        .update({
          tokens_in: (existing.tokens_in || 0) + (tokens_in || 0),
          tokens_out: (existing.tokens_out || 0) + (tokens_out || 0),
          cost_usd: Number(existing.cost_usd || 0) + (cost_usd || 0),
          session_count: (existing.session_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("date", today)
        .eq("model", modelName);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("daily_costs")
        .insert({
          date: today,
          model: modelName,
          tokens_in: tokens_in || 0,
          tokens_out: tokens_out || 0,
          cost_usd: cost_usd || 0,
          session_count: 1,
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
