import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export function validateLupeApiKey(request: NextRequest): boolean {
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${process.env.LUPE_API_KEY}`;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
