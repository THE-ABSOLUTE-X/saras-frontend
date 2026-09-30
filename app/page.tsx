"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { Radio } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Radio size={24} className="animate-pulse" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Loading SARAS Control Center...
        </p>
      </div>
    </main>
  );
}
