import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${daysInMonth}`;

    const dailyResult = await sql`
      SELECT
        date,
        model,
        tokens_in,
        tokens_out,
        cost_usd,
        session_count
      FROM daily_costs
      WHERE date >= ${startDate}::date AND date <= ${endDate}::date
      ORDER BY date ASC
    `;

    const totalsResult = await sql`
      SELECT
        COALESCE(SUM(tokens_in), 0) as total_tokens_in,
        COALESCE(SUM(tokens_out), 0) as total_tokens_out,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(SUM(session_count), 0) as total_sessions
      FROM daily_costs
      WHERE date >= ${startDate}::date AND date <= ${endDate}::date
    `;

    const totals = totalsResult.rows[0];
    const uniqueDays = new Set(dailyResult.rows.map((r) => r.date)).size;
    const dailyAvg = uniqueDays > 0 ? Number(totals.total_cost) / uniqueDays : 0;
    const projection = dailyAvg * daysInMonth;

    return NextResponse.json({
      month,
      daily: dailyResult.rows,
      totals: {
        tokens_in: Number(totals.total_tokens_in),
        tokens_out: Number(totals.total_tokens_out),
        cost_usd: Number(totals.total_cost),
        sessions: Number(totals.total_sessions),
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
