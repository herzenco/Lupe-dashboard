import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;

    const taskResult = await sql`
      SELECT * FROM tasks WHERE id = ${id}
    `;

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentsResult = await sql`
      SELECT * FROM task_comments
      WHERE task_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      task: taskResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (error) {
    console.error("Task detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
