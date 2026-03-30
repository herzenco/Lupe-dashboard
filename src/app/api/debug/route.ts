import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, string> = {};

  // Check env
  results.has_database_url = process.env.DATABASE_URL ? "yes" : "no";
  results.db_host = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : "N/A";

  // Try DNS resolution
  try {
    const dns = require("dns");
    const host = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).hostname
      : "";
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve(host, (err: Error | null, addrs: string[]) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    results.dns_resolve = addresses.join(", ");
  } catch (e: unknown) {
    const err = e as Error;
    results.dns_error = err.message;
  }

  // Try DB connection
  try {
    const { Client } = require("pg");
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    await client.connect();
    const res = await client.query("SELECT NOW() as now");
    results.db_connected = "yes";
    results.db_time = res.rows[0].now;
    await client.end();
  } catch (e: unknown) {
    const err = e as Error;
    results.db_error = err.message;
  }

  return NextResponse.json(results);
}
