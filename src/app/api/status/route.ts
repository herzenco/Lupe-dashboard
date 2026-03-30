import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLupeStatus, getSystemHealth } from "@/lib/kv";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const [lupeStatus, systemHealth] = await Promise.all([
      getLupeStatus(),
      getSystemHealth(),
    ]);

    return NextResponse.json({
      lupe: lupeStatus,
      system: systemHealth,
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
