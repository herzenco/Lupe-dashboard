import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const workspace = searchParams.get("workspace");
    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee");
    const search = searchParams.get("search");

    let query = supabase
      .from("tasks")
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (workspace) {
      query = query.eq("workspace", workspace);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (assignee) {
      query = query.contains("assignees", [{ username: assignee }]);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
