import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const month =
      searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

    // Fetch daily breakdown
    const { data: daily, error: dailyError } = await supabase
      .from("daily_costs")
      .select("date, model, tokens_in, tokens_out, cost_usd, session_count")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (dailyError) throw dailyError;

    const rows = daily || [];

    // Calculate totals from the rows
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let totalCost = 0;
    let totalSessions = 0;

    for (const row of rows) {
      totalTokensIn += Number(row.tokens_in) || 0;
      totalTokensOut += Number(row.tokens_out) || 0;
      totalCost += Number(row.cost_usd) || 0;
      totalSessions += Number(row.session_count) || 0;
    }

    const uniqueDays = new Set(rows.map((r) => r.date)).size;
    const dailyAvg = uniqueDays > 0 ? totalCost / uniqueDays : 0;
    const projection = dailyAvg * daysInMonth;

    return NextResponse.json({
      month,
      daily: rows,
      totals: {
        tokens_in: totalTokensIn,
        tokens_out: totalTokensOut,
        cost_usd: totalCost,
        sessions: totalSessions,
      },
      projection: {
        daily_avg: dailyAvg,
        month_projected: projection,
        days_in_month: daysInMonth,
        days_with_data: uniqueDays,
      },
    });
  } catch (error) {
    console.error("Costs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
