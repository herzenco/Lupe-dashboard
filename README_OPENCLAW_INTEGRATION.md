# OpenClaw Integration for Lupe Dashboard

This branch adds the necessary integration points for OpenClaw (Lupe) to connect to this dashboard.

## What's Been Added

### 1. Integration Scripts (`/openclaw-integration/`)
- `lupe-heartbeat.sh` - Sends regular status updates from OpenClaw
- `send-system-health.sh` - Reports system health metrics
- `tasks-sync.js` - Syncs tasks from Apple Reminders and ClickUp
- `LUPE_DASHBOARD_SKILL.md` - Skill documentation for OpenClaw

### 2. Environment Configuration
- `.env.example` - Template with all required environment variables
- Added `LUPE_API_KEY` authentication to all API endpoints

### 3. No UI/UX Changes
Per your requirements, I haven't touched:
- Any React components or UI code
- Styling or layouts
- Overall architecture
- Database schema

## How It Works

1. **Authentication**: All API endpoints now check for `Bearer ${LUPE_API_KEY}` token
2. **Data Flow**: OpenClaw → API endpoints → Vercel KV/Postgres → Dashboard UI
3. **Real-time**: Dashboard polls for updates (WebSocket support exists but not implemented)

## Setup Instructions

### 1. Deploy to Vercel

```bash
vercel --prod
```

### 2. Configure Environment Variables in Vercel Dashboard

Required:
- `LUPE_API_KEY` - Generate a secure token (e.g., `openssl rand -hex 32`)
- `NEXTAUTH_SECRET` - For session management
- `GOOGLE_CLIENT_ID/SECRET` - For Google OAuth
- Database URLs - Vercel will auto-populate when you add Postgres/KV

### 3. Configure OpenClaw

Add to your `.env.secrets`:
```bash
LUPE_DASHBOARD_URL=https://your-deployment.vercel.app
LUPE_API_KEY=same-key-as-above
```

### 4. Update HEARTBEAT.md

Add this to your heartbeat tasks:
```bash
# Send updates to Lupe Dashboard
if [ -n "$LUPE_API_KEY" ] && [ -n "$LUPE_DASHBOARD_URL" ]; then
  bash ~/.openclaw/workspace/Lupe-dashboard/openclaw-integration/lupe-heartbeat.sh
fi
```

### 5. Set Up Cron Job (Optional)

For automatic task syncing every 30 minutes:
```bash
openclaw cron add --schedule "*/30 * * * *" --name "sync-dashboard" \
  --command "cd ~/.openclaw/workspace/Lupe-dashboard && node openclaw-integration/tasks-sync.js"
```

## Testing Locally

1. Run the dashboard: `npm run dev`
2. Set env vars: `export LUPE_DASHBOARD_URL=http://localhost:3000 LUPE_API_KEY=test-key`
3. Test heartbeat: `bash openclaw-integration/lupe-heartbeat.sh`
4. Check the dashboard at http://localhost:3000

## API Endpoints Available

- `POST /api/heartbeat` - Update Lupe status
- `POST /api/system-health` - Update system metrics
- `POST /api/activity` - Log activities
- `POST /api/tasks/sync` - Sync tasks from external sources
- `GET /api/status` - Get current status (requires auth)
- `GET /api/costs` - Get usage costs
- `POST /api/webhooks/clickup` - Receive ClickUp webhooks

## Security Notes

- All endpoints require authentication via `LUPE_API_KEY`
- Dashboard uses NextAuth for user authentication
- API key should be kept secret and rotated periodically
- HTTPS is required in production

## Next Steps

After deployment:
1. Share the dashboard URL with Herzen
2. Configure Google OAuth for login
3. Set up ClickUp webhooks if needed
4. Monitor the logs for any integration issues

The dashboard will now show real data from OpenClaw!