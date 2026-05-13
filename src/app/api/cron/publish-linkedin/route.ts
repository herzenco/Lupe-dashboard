import { NextRequest, NextResponse } from "next/server";
import { publishApprovedClickUpPosts } from "@/lib/clickup-linkedin";

export const dynamic = "force-dynamic";

function parseTaskIds(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryRun = ["1", "true", "yes"].includes(
      (searchParams.get("dryRun") || "").toLowerCase()
    );
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const taskIds = parseTaskIds(searchParams.get("taskIds"));

    const result = await publishApprovedClickUpPosts({
      dryRun,
      limit: Number.isFinite(limit) ? limit : undefined,
      taskIds,
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
    });
  } catch (error) {
    console.error("Cron publish-linkedin error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
