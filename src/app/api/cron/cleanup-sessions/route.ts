import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("sessions")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString())
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      deleted: data?.length || 0,
    });
  } catch (error) {
    console.error("Cron cleanup-sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
