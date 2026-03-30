import { sql } from "@vercel/postgres";

export { sql };

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS heartbeats (
      id SERIAL PRIMARY KEY,
      status VARCHAR(20) NOT NULL,
      session_type VARCHAR(50),
      current_task TEXT,
      current_model VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      detail TEXT,
      model VARCHAR(100),
      tokens_in INTEGER,
      tokens_out INTEGER,
      cost_usd DECIMAL(10, 6),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_costs (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      model VARCHAR(100) NOT NULL,
      tokens_in BIGINT DEFAULT 0,
      tokens_out BIGINT DEFAULT 0,
      cost_usd DECIMAL(10, 4) DEFAULT 0,
      session_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(date, model)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(50) PRIMARY KEY,
      workspace VARCHAR(20) NOT NULL,
      team_id VARCHAR(50) NOT NULL,
      space_name VARCHAR(200),
      folder_name VARCHAR(200),
      list_name VARCHAR(200),
      name TEXT NOT NULL,
      description TEXT,
      status VARCHAR(100),
      priority INTEGER,
      assignees JSONB DEFAULT '[]',
      due_date TIMESTAMP,
      tags JSONB DEFAULT '[]',
      url VARCHAR(500),
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      synced_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_comments (
      id VARCHAR(50) PRIMARY KEY,
      task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE CASCADE,
      user_name VARCHAR(200),
      comment_text TEXT,
      created_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(100),
      channel VARCHAR(50),
      model VARCHAR(100),
      summary TEXT,
      transcript JSONB,
      token_count INTEGER,
      cost_usd DECIMAL(10, 4),
      started_at TIMESTAMP,
      ended_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS system_health (
      id SERIAL PRIMARY KEY,
      gateway_status VARCHAR(20),
      gateway_uptime_seconds INTEGER,
      mac_uptime_seconds INTEGER,
      cpu_percent DECIMAL(5, 2),
      memory_percent DECIMAL(5, 2),
      disk_percent DECIMAL(5, 2),
      telegram_status VARCHAR(20),
      drive_sync_status VARCHAR(20),
      error_log JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}
