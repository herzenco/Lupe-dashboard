import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, string> = {};

  results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing";
  results.supabase_key = process.env.SUPABASE_ANON_KEY ? "set" : "missing";

  try {
    const { data, error } = await supabase
      .from("heartbeats")
      .select("id")
      .limit(1);

    if (error) {
      results.select_error = error.message;
    } else {
      results.db_connected = "yes";
      results.heartbeats_count = String(data?.length || 0);
    }
  } catch (e: unknown) {
    const err = e as Error;
    results.select_error = err.message;
  }

  // Test INSERT
  try {
    const { error: insertErr } = await supabase.from("heartbeats").insert({
      status: "idle",
      session_type: "debug-test",
      current_task: "testing insert from Vercel",
      current_model: "debug",
    });

    if (insertErr) {
      results.insert_error = insertErr.message + " | " + insertErr.code;
    } else {
      results.insert_ok = "yes";
    }
  } catch (e: unknown) {
    const err = e as Error;
    results.insert_error = err.message;
  }

  return NextResponse.json(results);
}
