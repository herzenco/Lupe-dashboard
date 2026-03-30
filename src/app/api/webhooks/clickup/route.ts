import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.CLICKUP_WEBHOOK_SECRET) return false;
  const hmac = crypto
    .createHmac("sha256", process.env.CLICKUP_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return hmac === signature;
}

function getWorkspaceFromTeamId(teamId: string): string {
  if (teamId === process.env.CLICKUP_TEAM_HERZEN) return "herzen";
  if (teamId === process.env.CLICKUP_TEAM_SKYDEO) return "skydeo";
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, task_id, history_items } = payload;
    const teamId = payload.team_id || "";
    const workspace = getWorkspaceFromTeamId(teamId);

    switch (event) {
      case "taskCreated": {
        const task = payload.task || {};
        await sql`
          INSERT INTO tasks (id, workspace, team_id, name, status, priority, assignees, tags, url, created_at, updated_at)
          VALUES (
            ${task_id},
            ${workspace},
            ${teamId},
            ${task.name || ""},
            ${task.status?.status || ""},
            ${task.priority?.orderindex || null},
            ${JSON.stringify(task.assignees || [])},
            ${JSON.stringify(task.tags || [])},
            ${task.url || ""},
            NOW(), NOW()
          )
          ON CONFLICT (id) DO NOTHING
        `;
        break;
      }

      case "taskUpdated": {
        if (history_items && history_items.length > 0) {
          for (const item of history_items) {
            const field = item.field;
            const after = item.after;

            if (field === "name") {
              await sql`UPDATE tasks SET name = ${after}, updated_at = NOW() WHERE id = ${task_id}`;
            } else if (field === "description") {
              await sql`UPDATE tasks SET description = ${after}, updated_at = NOW() WHERE id = ${task_id}`;
            }
          }
        }
        break;
      }

      case "taskDeleted": {
        await sql`DELETE FROM tasks WHERE id = ${task_id}`;
        break;
      }

      case "taskStatusUpdated": {
        if (history_items?.[0]) {
          const newStatus = history_items[0].after?.status || history_items[0].after;
          await sql`UPDATE tasks SET status = ${newStatus}, updated_at = NOW() WHERE id = ${task_id}`;
        }
        break;
      }

      case "taskAssigneeUpdated": {
        if (history_items?.[0]) {
          const assignees = history_items[0].after || [];
          await sql`
            UPDATE tasks SET assignees = ${JSON.stringify(assignees)}, updated_at = NOW()
            WHERE id = ${task_id}
          `;
        }
        break;
      }

      case "taskCommentPosted": {
        if (history_items?.[0]) {
          const comment = history_items[0];
          await sql`
            INSERT INTO task_comments (id, task_id, user_name, comment_text, created_at)
            VALUES (
              ${comment.id || crypto.randomUUID()},
              ${task_id},
              ${comment.user?.username || "unknown"},
              ${comment.comment?.text_content || comment.after || ""},
              NOW()
            )
            ON CONFLICT (id) DO NOTHING
          `;
        }
        break;
      }

      case "taskPriorityUpdated": {
        if (history_items?.[0]) {
          const newPriority = history_items[0].after?.orderindex ?? history_items[0].after;
          await sql`UPDATE tasks SET priority = ${newPriority}, updated_at = NOW() WHERE id = ${task_id}`;
        }
        break;
      }

      case "taskDueDateUpdated": {
        if (history_items?.[0]) {
          const dueDate = history_items[0].after
            ? new Date(parseInt(history_items[0].after)).toISOString()
            : null;
          await sql`UPDATE tasks SET due_date = ${dueDate}, updated_at = NOW() WHERE id = ${task_id}`;
        }
        break;
      }

      default:
        console.log("Unhandled ClickUp webhook event:", event);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ClickUp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
