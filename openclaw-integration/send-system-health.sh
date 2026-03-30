#!/bin/bash
# Send system health data to Lupe Dashboard

DASHBOARD_URL="${LUPE_DASHBOARD_URL:-http://localhost:3000}"
API_KEY="${LUPE_API_KEY}"

# Get gateway status
GATEWAY_STATUS=$(openclaw gateway status --json 2>/dev/null || echo '{"status":"unknown"}')
GATEWAY_UPTIME=$(echo "$GATEWAY_STATUS" | jq -r '.uptime_seconds // 0')

# Get system stats
MAC_UPTIME=$(sysctl -n kern.boottime | awk '{print $4}' | sed 's/,//')
MAC_UPTIME=$(($(date +%s) - $MAC_UPTIME))

CPU_PERCENT=$(ps -A -o %cpu | awk '{s+=$1} END {print s}')
MEMORY_PERCENT=$(ps -A -o %mem | awk '{s+=$1} END {print s}')
DISK_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Check Telegram status
TELEGRAM_STATUS="unknown"
if openclaw channels status --probe telegram &>/dev/null; then
  TELEGRAM_STATUS="connected"
else
  TELEGRAM_STATUS="disconnected"
fi

# Check Google Drive sync
DRIVE_SYNC_STATUS="unknown"
if pgrep -x "Google Drive" > /dev/null; then
  DRIVE_SYNC_STATUS="running"
fi

# Get recent errors
ERROR_LOG=$(openclaw logs --tail 50 2>/dev/null | grep -i error | tail -5 | jq -Rs 'split("\n") | map(select(length > 0))' || echo '[]')

# Send to dashboard
curl -s -X POST "${DASHBOARD_URL}/api/system-health" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "gateway_status": "$(echo "$GATEWAY_STATUS" | jq -r '.status // "unknown"')",
  "gateway_uptime_seconds": ${GATEWAY_UPTIME},
  "mac_uptime_seconds": ${MAC_UPTIME},
  "cpu_percent": ${CPU_PERCENT%%.*},
  "memory_percent": ${MEMORY_PERCENT%%.*},
  "disk_percent": ${DISK_PERCENT},
  "telegram_status": "${TELEGRAM_STATUS}",
  "drive_sync_status": "${DRIVE_SYNC_STATUS}",
  "error_log": ${ERROR_LOG},
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "System health sent at $(date)"