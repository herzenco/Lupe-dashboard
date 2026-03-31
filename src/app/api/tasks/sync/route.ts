import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status?: { status: string };
  priority?: { orderindex: number };
  assignees?: Array<{ username: string; email: string }>;
  due_date?: string;
  tags?: Array<{ name: string }>;
  url?: string;
  date_created?: string;
  date_updated?: string;
  space?: { name: string };
  folder?: { name: string };
  list?: { name: string };
}

async function syncWorkspace(teamId: string, workspace: string) {
  const response = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=true&subtasks=true`,
    {
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN!,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `ClickUp API error for ${workspace}: ${response.status}`
    );
  }

  const data = await response.json();
  const tasks: ClickUpTask[] = data.tasks || [];

  for (const task of tasks) {
    await supabase.from("tasks").upsert(
      {
        id: task.id,
        workspace,
        team_id: teamId,
        space_name: task.space?.name || null,
        folder_name: task.folder?.name || null,
        list_name: task.list?.name || null,
        name: task.name,
        description: task.description || "",
        status: task.status?.status || "",
        priority: task.priority?.orderindex || null,
        assignees: task.assignees || [],
        due_date: task.due_date
          ? new Date(parseInt(task.due_date)).toISOString()
          : null,
        tags: task.tags || [],
        url: task.url || "",
        created_at: task.date_created
          ? new Date(parseInt(task.date_created)).toISOString()
          : null,
        updated_at: task.date_updated
          ? new Date(parseInt(task.date_updated)).toISOString()
          : null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  }

  return tasks.length;
}

export async function POST() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    let herzenCount = 0;
    let skydeoCount = 0;

    if (process.env.CLICKUP_TEAM_HERZEN) {
      herzenCount = await syncWorkspace(
        process.env.CLICKUP_TEAM_HERZEN,
        "herzen"
      );
    }

    if (process.env.CLICKUP_TEAM_SKYDEO) {
      skydeoCount = await syncWorkspace(
        process.env.CLICKUP_TEAM_SKYDEO,
        "skydeo"
      );
    }

    return NextResponse.json({
      ok: true,
      synced: {
        herzen: herzenCount,
        skydeo: skydeoCount,
      },
    });
  } catch (error) {
    console.error("Task sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
