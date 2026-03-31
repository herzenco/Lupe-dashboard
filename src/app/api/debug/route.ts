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
      results.db_error = error.message;
    } else {
      results.db_connected = "yes";
      results.heartbeats_count = String(data?.length || 0);
    }
  } catch (e: unknown) {
    const err = e as Error;
    results.db_error = err.message;
  }

  return NextResponse.json(results);
}
