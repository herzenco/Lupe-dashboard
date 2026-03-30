import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { initializeDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await initializeDatabase();
    return NextResponse.json({ ok: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
