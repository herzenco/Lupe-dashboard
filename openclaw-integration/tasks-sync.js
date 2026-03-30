#!/usr/bin/env node
// Sync tasks from OpenClaw to Lupe Dashboard

const { execSync } = require('child_process');
const https = require('https');
const url = require('url');

const DASHBOARD_URL = process.env.LUPE_DASHBOARD_URL || 'http://localhost:3000';
const API_KEY = process.env.LUPE_API_KEY;

if (!API_KEY) {
  console.error('LUPE_API_KEY environment variable is required');
  process.exit(1);
}

// Get tasks from Apple Reminders
function getAppleReminders() {
  try {
    const output = execSync('remindctl list --json --limit 50', { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Failed to get Apple Reminders:', error.message);
    return { tasks: [] };
  }
}

// Get tasks from ClickUp (both workspaces)
function getClickUpTasks() {
  const tasks = [];
  
  // Herzen Co workspace
  if (process.env.CLICKUP_TOKEN_HERZEN) {
    try {
      const herzenTasks = execSync(`curl -s -H "Authorization: ${process.env.CLICKUP_TOKEN_HERZEN}" "https://api.clickup.com/api/v2/team/9014626967/task?assignees[]=${process.env.USER}"`, { encoding: 'utf-8' });
      const parsed = JSON.parse(herzenTasks);
      tasks.push(...parsed.tasks.map(t => ({ ...t, workspace: 'herzen' })));
    } catch (e) {
      console.error('Failed to get Herzen tasks:', e.message);
    }
  }

  // Skydeo workspace  
  if (process.env.CLICKUP_TOKEN_SKYDEO) {
    try {
      const skydeoTasks = execSync(`curl -s -H "Authorization: ${process.env.CLICKUP_TOKEN_SKYDEO}" "https://api.clickup.com/api/v2/team/9006079969/task?assignees[]=${process.env.USER}"`, { encoding: 'utf-8' });
      const parsed = JSON.parse(skydeoTasks);
      tasks.push(...parsed.tasks.map(t => ({ ...t, workspace: 'skydeo' })));
    } catch (e) {
      console.error('Failed to get Skydeo tasks:', e.message);
    }
  }

  return tasks;
}

// Send tasks to dashboard
function sendToDashboard(tasks) {
  const parsedUrl = url.parse(DASHBOARD_URL);
  const data = JSON.stringify({ tasks });
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: '/api/tasks/sync',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = (parsedUrl.protocol === 'https:' ? https : require('http')).request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      console.log(`Tasks synced: ${res.statusCode}`);
      if (res.statusCode !== 200) {
        console.error('Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Main
const reminders = getAppleReminders();
const clickupTasks = getClickUpTasks();

const allTasks = [
  ...reminders.tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.completed ? 'completed' : 'open',
    due: t.due_date,
    source: 'apple_reminders'
  })),
  ...clickupTasks.map(t => ({
    id: t.id,
    title: t.name,
    status: t.status.status,
    due: t.due_date,
    source: 'clickup',
    workspace: t.workspace
  }))
];

sendToDashboard(allTasks);