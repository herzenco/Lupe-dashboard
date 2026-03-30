import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateLupeApiKey, requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!validateLupeApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, detail, model, tokens_in, tokens_out, cost_usd } = body;

    await sql`
      INSERT INTO activity_log (action, detail, model, tokens_in, tokens_out, cost_usd)
      VALUES (${action}, ${detail}, ${model}, ${tokens_in}, ${tokens_out}, ${cost_usd})
    `;

    const today = new Date().toISOString().split("T")[0];
    await sql`
      INSERT INTO daily_costs (date, model, tokens_in, tokens_out, cost_usd, session_count)
      VALUES (${today}, ${model || "unknown"}, ${tokens_in || 0}, ${tokens_out || 0}, ${cost_usd || 0}, 1)
      ON CONFLICT (date, model) DO UPDATE SET
        tokens_in = daily_costs.tokens_in + EXCLUDED.tokens_in,
        tokens_out = daily_costs.tokens_out + EXCLUDED.tokens_out,
        cost_usd = daily_costs.cost_usd + EXCLUDED.cost_usd,
        session_count = daily_costs.session_count + 1,
        updated_at = NOW()
    `;

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
    const result = await sql`
      SELECT * FROM activity_log
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
