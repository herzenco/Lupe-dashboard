import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
    throw new Error(`ClickUp API error for ${workspace}: ${response.status}`);
  }

  const data = await response.json();
  const tasks: ClickUpTask[] = data.tasks || [];

  for (const task of tasks) {
    await sql`
      INSERT INTO tasks (
        id, workspace, team_id, space_name, folder_name, list_name,
        name, description, status, priority, assignees, due_date,
        tags, url, created_at, updated_at, synced_at
      ) VALUES (
        ${task.id},
        ${workspace},
        ${teamId},
        ${task.space?.name || null},
        ${task.folder?.name || null},
        ${task.list?.name || null},
        ${task.name},
        ${task.description || ""},
        ${task.status?.status || ""},
        ${task.priority?.orderindex || null},
        ${JSON.stringify(task.assignees || [])},
        ${task.due_date ? new Date(parseInt(task.due_date)).toISOString() : null},
        ${JSON.stringify(task.tags || [])},
        ${task.url || ""},
        ${task.date_created ? new Date(parseInt(task.date_created)).toISOString() : null},
        ${task.date_updated ? new Date(parseInt(task.date_updated)).toISOString() : null},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        assignees = EXCLUDED.assignees,
        due_date = EXCLUDED.due_date,
        tags = EXCLUDED.tags,
        url = EXCLUDED.url,
        space_name = EXCLUDED.space_name,
        folder_name = EXCLUDED.folder_name,
        list_name = EXCLUDED.list_name,
        updated_at = EXCLUDED.updated_at,
        synced_at = NOW()
    `;
  }

  return tasks.length;
}

export async function GET() {
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
    console.error("Cron sync-clickup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
