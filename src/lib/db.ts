import { supabase } from "./supabase";

// Re-export supabase for direct use in routes
export { supabase };

// Tables are already created in Supabase — this is a no-op now
export async function initializeDatabase() {
  // Tables were created via Supabase SQL Editor.
  // This function exists to maintain the interface for the setup route.
  const { error } = await supabase.from("heartbeats").select("id").limit(1);
  if (error) {
    throw new Error(`Database check failed: ${error.message}`);
  }
}
