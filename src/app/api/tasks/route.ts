import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const workspace = searchParams.get("workspace");
    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee");
    const search = searchParams.get("search");

    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (workspace) {
      query += ` AND workspace = $${paramIndex++}`;
      params.push(workspace);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (assignee) {
      query += ` AND assignees @> $${paramIndex++}::jsonb`;
      params.push(JSON.stringify([{ username: assignee }]));
    }
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY updated_at DESC NULLS LAST`;

    const result = await sql.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
