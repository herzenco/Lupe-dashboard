import { NextRequest, NextResponse } from "next/server";
import { validateLupeApiKey, requireAuth } from "@/lib/auth";
import { kvGet, kvSet } from "@/lib/kv";

export const dynamic = "force-dynamic";

const CALENDAR_KV_KEY = "lupe:calendar";

export async function POST(request: NextRequest) {
  if (!validateLupeApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await kvSet(CALENDAR_KV_KEY, body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Calendar POST error:", error);
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
    const data = await kvGet(CALENDAR_KV_KEY);
    return NextResponse.json(data || { events: [] });
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
