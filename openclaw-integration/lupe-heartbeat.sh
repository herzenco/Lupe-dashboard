#!/bin/bash
# Lupe Dashboard Heartbeat Script
# This sends regular updates from OpenClaw to the dashboard

DASHBOARD_URL="${LUPE_DASHBOARD_URL:-http://localhost:3000}"
API_KEY="${LUPE_API_KEY}"

# Get current session status
SESSION_STATUS=$(openclaw session status --json 2>/dev/null || echo '{}')
CURRENT_MODEL=$(echo "$SESSION_STATUS" | jq -r '.model // "anthropic/claude-sonnet-4-6"')
SESSION_TYPE=$(echo "$SESSION_STATUS" | jq -r '.session_type // "main"')

# Get current task from dashboard status file
CURRENT_TASK="Idle"
if [ -f ~/.openclaw/workspace/dashboard/status.json ]; then
  CURRENT_TASK=$(cat ~/.openclaw/workspace/dashboard/status.json | jq -r '.currentTask // "Idle"')
fi

# Send heartbeat
curl -s -X POST "${DASHBOARD_URL}/api/heartbeat" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "status": "active",
  "session_type": "${SESSION_TYPE}",
  "current_task": "${CURRENT_TASK}",
  "current_model": "${CURRENT_MODEL}"
}
EOF

echo "Heartbeat sent at $(date)"