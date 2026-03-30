import { NextRequest, NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
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

    let query = `
      SELECT id, session_id, channel, model, summary,
             token_count, cost_usd, started_at, ended_at
      FROM sessions WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from) {
      query += ` AND started_at >= $${paramIndex++}::timestamp`;
      params.push(from);
    }
    if (to) {
      query += ` AND started_at <= $${paramIndex++}::timestamp`;
      params.push(to);
    }
    if (channel) {
      query += ` AND channel = $${paramIndex++}`;
      params.push(channel);
    }
    if (search) {
      query += ` AND (summary ILIKE $${paramIndex} OR session_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY started_at DESC NULLS LAST LIMIT 100`;

    const result = await rawQuery(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Sessions list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
