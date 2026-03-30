import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const WEBHOOK_EVENTS = [
  "taskCreated",
  "taskUpdated",
  "taskDeleted",
  "taskStatusUpdated",
  "taskAssigneeUpdated",
  "taskCommentPosted",
  "taskPriorityUpdated",
  "taskDueDateUpdated",
];

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const endpointUrl =
      body.endpoint_url ||
      `${process.env.NEXTAUTH_URL}/api/webhooks/clickup`;

    const results: Record<string, unknown> = {};

    const teamIds = [
      { id: process.env.CLICKUP_TEAM_HERZEN, name: "herzen" },
      { id: process.env.CLICKUP_TEAM_SKYDEO, name: "skydeo" },
    ];

    for (const team of teamIds) {
      if (!team.id) continue;

      const response = await fetch(
        `https://api.clickup.com/api/v2/team/${team.id}/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.CLICKUP_API_TOKEN!,
          },
          body: JSON.stringify({
            endpoint: endpointUrl,
            events: WEBHOOK_EVENTS,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        results[team.name] = { error: errorText, status: response.status };
      } else {
        const data = await response.json();
        results[team.name] = { ok: true, webhook_id: data.id };
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Setup webhooks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
