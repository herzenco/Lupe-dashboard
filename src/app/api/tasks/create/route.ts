import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getWorkspaceFromTeamId(teamId: string): string {
  if (teamId === process.env.CLICKUP_TEAM_HERZEN) return "herzen";
  if (teamId === process.env.CLICKUP_TEAM_SKYDEO) return "skydeo";
  return "unknown";
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      name,
      description,
      list_id,
      priority,
      assignees,
      due_date,
      tags,
      workspace,
    } = body;

    const clickupPayload: Record<string, unknown> = {
      name,
      description: description || "",
      priority: priority || null,
      assignees: assignees || [],
      due_date: due_date ? new Date(due_date).getTime() : null,
      tags: tags || [],
    };

    const clickupResponse = await fetch(
      `https://api.clickup.com/api/v2/list/${list_id}/task`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.CLICKUP_API_TOKEN!,
        },
        body: JSON.stringify(clickupPayload),
      }
    );

    if (!clickupResponse.ok) {
      const errorText = await clickupResponse.text();
      console.error("ClickUp create error:", errorText);
      return NextResponse.json(
        { error: "Failed to create task in ClickUp" },
        { status: 502 }
      );
    }

    const clickupTask = await clickupResponse.json();
    const teamId = clickupTask.team_id;
    const resolvedWorkspace =
      workspace || getWorkspaceFromTeamId(teamId);

    await sql`
      INSERT INTO tasks (
        id, workspace, team_id, name, description, status, priority,
        assignees, due_date, tags, url, created_at, updated_at
      ) VALUES (
        ${clickupTask.id},
        ${resolvedWorkspace},
        ${teamId},
        ${clickupTask.name},
        ${clickupTask.description || ""},
        ${clickupTask.status?.status || ""},
        ${clickupTask.priority?.orderindex || null},
        ${JSON.stringify(clickupTask.assignees || [])},
        ${clickupTask.due_date ? new Date(parseInt(clickupTask.due_date)).toISOString() : null},
        ${JSON.stringify(clickupTask.tags || [])},
        ${clickupTask.url || ""},
        ${clickupTask.date_created ? new Date(parseInt(clickupTask.date_created)).toISOString() : new Date().toISOString()},
        ${clickupTask.date_updated ? new Date(parseInt(clickupTask.date_updated)).toISOString() : new Date().toISOString()}
      )
    `;

    return NextResponse.json({ ok: true, task_id: clickupTask.id });
  } catch (error) {
    console.error("Task create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
