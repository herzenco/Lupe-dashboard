import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateLupeApiKey } from "@/lib/auth";

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

    await sql`
      INSERT INTO sessions (session_id, channel, model, summary, transcript, token_count, cost_usd, started_at, ended_at)
      VALUES (
        ${session_id}, ${channel}, ${model}, ${summary},
        ${JSON.stringify(transcript)}, ${token_count}, ${cost_usd},
        ${started_at}, ${ended_at}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
