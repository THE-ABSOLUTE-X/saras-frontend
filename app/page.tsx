"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center">

        <p className="text-cyan-400 tracking-[0.4em] text-sm mb-4">
          SEARCH & RESCUE AUTOMATED SYSTEM
        </p>

        <h1 className="text-6xl font-bold text-white mb-4">
          SARAS
        </h1>

        <p className="text-slate-400 text-lg mb-8">
          Operator Control Center
        </p>

        <button
          onClick={() => router.push("/login")}
          className="px-8 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition"
        >
          Start Operator Login →
        </button>

      </div>
    </main>
  );
}