const CLICKUP_LIST_ID = "901416157162";
const DEFAULT_CLICKUP_TEAM_ID = "9014626967";
const TARGET_TIME_ZONE = "America/New_York";

type ClickUpStatus = {
  status?: string;
  type?: string;
};

type ClickUpComment = {
  comment_text?: string;
  user?: {
    username?: string;
    email?: string;
  };
  date?: string | number;
};

type ClickUpTask = {
  id: string;
  name: string;
  description?: string;
  due_date?: string | null;
  status?: ClickUpStatus;
  url?: string;
};

type ClickUpList = {
  id: string;
  name: string;
  statuses?: Array<{
    status: string;
    type?: string;
  }>;
};

type PublishOptions = {
  dryRun?: boolean;
  limit?: number;
  taskIds?: string[];
};

type PublishResult = {
  taskId: string;
  taskName: string;
  dueDate: string | null;
  dryRun: boolean;
  action: "posted" | "skipped" | "would_post" | "failed";
  reason?: string;
  linkedinUrn?: string;
  linkedinUrl?: string;
  clickupStatusApplied?: string;
};

type RejectedAuditResult = {
  taskId: string;
  taskName: string;
  dueDate: string | null;
  commentsCount: number;
  latestComment?: string;
  latestCommentAuthor?: string;
  latestCommentDate?: string;
};

type PublishSummary = {
  ok: boolean;
  dryRun: boolean;
  listId: string;
  listName: string;
  found: number;
  eligible: number;
  processed: number;
  posted: number;
  skipped: number;
  failed: number;
  rejectedReviewed: number;
  rejected: RejectedAuditResult[];
  results: PublishResult[];
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isoFromMs(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isDueToday(dueDateMs?: string | null): boolean {
  if (!dueDateMs) return false;
  const dueDate = new Date(Number(dueDateMs));
  if (Number.isNaN(dueDate.getTime())) return false;
  return dateInTimeZone(dueDate, TARGET_TIME_ZONE) === todayInTimeZone(TARGET_TIME_ZONE);
}

function normalizeStatus(status?: string): string {
  return (status || "").trim().toLowerCase();
}

function extractPostBody(task: ClickUpTask): string {
  return (task.description || "").trim();
}

function buildLinkedInUrl(linkedinUrn?: string): string | undefined {
  if (!linkedinUrn) return undefined;
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(linkedinUrn)}/`;
}

function safeCommentPreview(text?: string): string | undefined {
  if (!text) return undefined;
  return text.replace(/\s+/g, " ").trim().slice(0, 280);
}

async function clickUpFetch(path: string, init?: RequestInit) {
  const token = getRequiredEnv("CLICKUP_TOKEN_HERZEN");
  const response = await fetch(`https://api.clickup.com/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ClickUp API ${response.status} for ${path}: ${body}`);
  }

  return response;
}

async function getList(): Promise<ClickUpList> {
  const response = await clickUpFetch(`/list/${CLICKUP_LIST_ID}`);
  return response.json();
}

async function getListTasks(): Promise<ClickUpTask[]> {
  const response = await clickUpFetch(
    `/list/${CLICKUP_LIST_ID}/task?include_closed=true&subtasks=true`
  );
  const data = await response.json();
  return data.tasks || [];
}

async function getTaskComments(taskId: string): Promise<ClickUpComment[]> {
  const response = await clickUpFetch(`/task/${taskId}/comment`);
  const data = await response.json();
  return data.comments || [];
}

async function updateTaskStatus(taskId: string, status: string) {
  await clickUpFetch(`/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

async function addTaskComment(taskId: string, commentText: string) {
  await clickUpFetch(`/task/${taskId}/comment`, {
    method: "POST",
    body: JSON.stringify({ comment_text: commentText, notify_all: false }),
  });
}

async function postToLinkedIn(text: string) {
  const accessToken = getRequiredEnv("LINKEDIN_ACCESS_TOKEN");
  const personUrn = getRequiredEnv("LINKEDIN_PERSON_URN");

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LinkedIn API ${response.status}: ${body}`);
  }

  let json: { id?: string } | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const linkedinUrn = response.headers.get("x-restli-id") || json?.id;
  return {
    linkedinUrn,
    linkedinUrl: buildLinkedInUrl(linkedinUrn),
  };
}

function getCompletionStatus(list: ClickUpList): string {
  const statuses = list.statuses || [];
  const posted = statuses.find((entry) => normalizeStatus(entry.status) === "posted");
  if (posted) return posted.status;

  const complete = statuses.find((entry) => normalizeStatus(entry.status) === "complete");
  if (complete) return complete.status;

  throw new Error(`List ${list.id} does not have a Posted or Complete status`);
}

function getApprovedTasksDueToday(tasks: ClickUpTask[], taskIds?: string[]): ClickUpTask[] {
  const taskIdSet = taskIds?.length ? new Set(taskIds) : null;

  return tasks.filter((task) => {
    if (taskIdSet && !taskIdSet.has(task.id)) return false;
    if (normalizeStatus(task.status?.status) !== "approved") return false;
    return isDueToday(task.due_date);
  });
}

function getRejectedTasks(tasks: ClickUpTask[]): ClickUpTask[] {
  return tasks.filter((task) => normalizeStatus(task.status?.status) === "rejected");
}

async function auditRejectedTasks(tasks: ClickUpTask[]): Promise<RejectedAuditResult[]> {
  const rejectedTasks = getRejectedTasks(tasks);
  const audits: RejectedAuditResult[] = [];

  for (const task of rejectedTasks) {
    const comments = await getTaskComments(task.id);
    const latest = comments[comments.length - 1];
    audits.push({
      taskId: task.id,
      taskName: task.name,
      dueDate: isoFromMs(task.due_date),
      commentsCount: comments.length,
      latestComment: safeCommentPreview(latest?.comment_text),
      latestCommentAuthor: latest?.user?.username || latest?.user?.email,
      latestCommentDate: latest?.date ? new Date(Number(latest.date)).toISOString() : undefined,
    });
  }

  return audits;
}

export async function publishApprovedClickUpPosts(
  options: PublishOptions = {}
): Promise<PublishSummary> {
  const list = await getList();
  const tasks = await getListTasks();
  const completionStatus = getCompletionStatus(list);
  const eligibleTasks = getApprovedTasksDueToday(tasks, options.taskIds);
  const limitedTasks =
    typeof options.limit === "number" ? eligibleTasks.slice(0, options.limit) : eligibleTasks;

  const results: PublishResult[] = [];

  for (const task of limitedTasks) {
    const postBody = extractPostBody(task);
    const dueDate = isoFromMs(task.due_date);

    if (!postBody) {
      results.push({
        taskId: task.id,
        taskName: task.name,
        dueDate,
        dryRun: Boolean(options.dryRun),
        action: "skipped",
        reason: "Empty task description, nothing to publish",
      });
      continue;
    }

    if (options.dryRun) {
      results.push({
        taskId: task.id,
        taskName: task.name,
        dueDate,
        dryRun: true,
        action: "would_post",
        linkedinUrl: undefined,
        reason: `Would publish ${postBody.length} characters to LinkedIn and mark ClickUp as ${completionStatus}`,
      });
      continue;
    }

    try {
      const { linkedinUrn, linkedinUrl } = await postToLinkedIn(postBody);
      await updateTaskStatus(task.id, completionStatus);

      const commentLines = [
        `Posted to LinkedIn on ${new Date().toISOString()}.`,
        linkedinUrn ? `URN: ${linkedinUrn}` : null,
        linkedinUrl ? `URL: ${linkedinUrl}` : null,
      ].filter(Boolean);

      await addTaskComment(task.id, commentLines.join("\n"));

      results.push({
        taskId: task.id,
        taskName: task.name,
        dueDate,
        dryRun: false,
        action: "posted",
        linkedinUrn,
        linkedinUrl,
        clickupStatusApplied: completionStatus,
      });
    } catch (error) {
      results.push({
        taskId: task.id,
        taskName: task.name,
        dueDate,
        dryRun: false,
        action: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const rejected = await auditRejectedTasks(tasks);
  const posted = results.filter((item) => item.action === "posted").length;
  const skipped = results.filter(
    (item) => item.action === "skipped" || item.action === "would_post"
  ).length;
  const failed = results.filter((item) => item.action === "failed").length;

  return {
    ok: failed === 0,
    dryRun: Boolean(options.dryRun),
    listId: CLICKUP_LIST_ID,
    listName: list.name,
    found: tasks.length,
    eligible: eligibleTasks.length,
    processed: results.length,
    posted,
    skipped,
    failed,
    rejectedReviewed: rejected.length,
    rejected,
    results,
  };
}

export const clickUpLinkedInConfig = {
  listId: CLICKUP_LIST_ID,
  teamId: DEFAULT_CLICKUP_TEAM_ID,
  timeZone: TARGET_TIME_ZONE,
};
