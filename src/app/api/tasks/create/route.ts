import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
    const resolvedWorkspace = workspace || getWorkspaceFromTeamId(teamId);

    const { error } = await supabase.from("tasks").insert({
      id: clickupTask.id,
      workspace: resolvedWorkspace,
      team_id: teamId,
      name: clickupTask.name,
      description: clickupTask.description || "",
      status: clickupTask.status?.status || "",
      priority: clickupTask.priority?.orderindex || null,
      assignees: clickupTask.assignees || [],
      due_date: clickupTask.due_date
        ? new Date(parseInt(clickupTask.due_date)).toISOString()
        : null,
      tags: clickupTask.tags || [],
      url: clickupTask.url || "",
      created_at: clickupTask.date_created
        ? new Date(parseInt(clickupTask.date_created)).toISOString()
        : new Date().toISOString(),
      updated_at: clickupTask.date_updated
        ? new Date(parseInt(clickupTask.date_updated)).toISOString()
        : new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, task_id: clickupTask.id });
  } catch (error) {
    console.error("Task create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
