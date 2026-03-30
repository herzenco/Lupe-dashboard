import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`
      DELETE FROM sessions
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    return NextResponse.json({
      ok: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error("Cron cleanup-sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
