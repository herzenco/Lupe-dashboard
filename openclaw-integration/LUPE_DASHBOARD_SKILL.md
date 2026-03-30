# Lupe Dashboard Integration Skill

This skill enables OpenClaw to send data to the Lupe Dashboard for monitoring and control.

## Environment Variables Required

- `LUPE_DASHBOARD_URL`: The URL of your deployed dashboard (e.g., https://lupe.herzenco.com)
- `LUPE_API_KEY`: API key for authentication (must match the dashboard's LUPE_API_KEY env var)

## Available Commands

### Send Heartbeat
```bash
bash openclaw-integration/lupe-heartbeat.sh
```

### Send System Health
```bash
bash openclaw-integration/send-system-health.sh
```

### Send Activity Log
```bash
# Example: Log an activity
curl -X POST "${LUPE_DASHBOARD_URL}/api/activity" \
  -H "Authorization: Bearer ${LUPE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_completed",
    "description": "Updated MEMORY.md with new context",
    "metadata": {
      "file": "MEMORY.md",
      "lines_added": 15
    }
  }'
```

### Sync Tasks from ClickUp
```bash
curl -X POST "${LUPE_DASHBOARD_URL}/api/tasks/sync" \
  -H "Authorization: Bearer ${LUPE_API_KEY}"
```

### Get Current Costs
```bash
curl "${LUPE_DASHBOARD_URL}/api/costs" \
  -H "Authorization: Bearer ${LUPE_API_KEY}"
```

## Setting Up Automatic Updates

Add to your HEARTBEAT.md:

```markdown
## Dashboard Updates
- Send heartbeat to Lupe Dashboard
- Update system health metrics
```

Then in your heartbeat handler, run:

```bash
if [ -n "$LUPE_API_KEY" ] && [ -n "$LUPE_DASHBOARD_URL" ]; then
  bash ~/.openclaw/workspace/Lupe-dashboard/openclaw-integration/lupe-heartbeat.sh
  bash ~/.openclaw/workspace/Lupe-dashboard/openclaw-integration/send-system-health.sh
fi
```

## WebSocket Integration (Future)

The dashboard supports WebSocket connections for real-time updates. Once deployed, you can connect using:

```javascript
const ws = new WebSocket('wss://lupe.herzenco.com/api/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: process.env.LUPE_API_KEY
}));
```