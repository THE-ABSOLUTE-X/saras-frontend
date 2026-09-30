"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { authService } from "@/services/authService";
import { apiService } from "@/services/apiService";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("saras123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }

    // Quick backend connectivity probe
    apiService
      .fetchRobotState("SARAS-01")
      .then((res) => {
        setBackendOnline(res !== null);
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, [router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await authService.login(username, password);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Authentication failed.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-radial from-[#172554] via-[#020617] to-black flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md">
        {/* SARAS Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Radio size={28} className="animate-pulse" />
          </div>

          <div className="text-xs font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">
            SARAS COMMAND CENTER
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Search & Rescue Automated System
          </h1>

          <p className="text-xs text-slate-400 mt-1 font-mono">
            SIH 2026 • Robotics Mission Operations
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B1222]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Operator Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticate mission control console session
              </p>
            </div>

            {/* Backend connection pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#070D1C] px-2.5 py-1 text-[10px] font-mono">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  backendOnline === true
                    ? "bg-green-400 animate-pulse"
                    : backendOnline === false
                      ? "bg-amber-400"
                      : "bg-slate-500"
                }`}
              />
              <span className="text-slate-400">
                {backendOnline === true
                  ? "BACKEND LIVE"
                  : backendOnline === false
                    ? "LOCAL DEV"
                    : "CHECKING"}
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Operator ID / Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator username"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#070D1C] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Security Passcode
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#070D1C] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
                  <span>Authorizing Console...</span>
                </>
              ) : (
                <>
                  <span>Access SARAS Operations</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center font-mono">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
              Field Demo Credentials
            </span>
            <div className="inline-flex items-center gap-3 rounded-lg border border-slate-800 bg-[#070D1C] px-3 py-1.5 text-xs text-slate-300">
              <span>
                User: <strong className="text-cyan-400">admin</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Pass: <strong className="text-cyan-400">saras123</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] font-mono text-slate-500">
          SARAS-01 • Autonomous Rescue Robotics Station
        </div>
      </div>
    </main>
  );
}