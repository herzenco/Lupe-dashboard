"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface LupeStatus {
  status: "active" | "idle" | "error";
  current_task: string;
  session_type: string;
  current_model: string;
  last_heartbeat: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lupeStatus, setLupeStatus] = useState<LupeStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        if (data.lupe) setLupeStatus(data.lupe);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [status, fetchStatus]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        lupeStatus={lupeStatus}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <TopBar
          lupeStatus={lupeStatus}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-3 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
