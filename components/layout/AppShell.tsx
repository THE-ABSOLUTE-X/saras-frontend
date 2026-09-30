"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Gamepad2,
  Activity,
  Smartphone,
  AlertOctagon,
  LogOut,
  Radio,
  Battery,
  BatteryWarning,
  Flame,
  Loader2,
  Menu,
  X,
  Volume2,
} from "lucide-react";
import { authService } from "@/services/authService";
import { useRobotStore } from "@/stores/useRobotStore";
import { apiService } from "@/services/apiService";
import RealtimeManager from "@/components/realtime/RealtimeManager";

export interface AppShellProps {
  children: React.ReactNode;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return authService.isAuthenticated();
}

function getServerSnapshot() {
  return false;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const {
    telemetry,
    wsConnected,
    operatorContact,
    setOperatorContact,
    addLog,
  } = useRobotStore();

  // Auth Protection Guard
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    }
  }, [router, isAuthed]);

  const handleLogout = () => {
    authService.logout();
    router.replace("/login");
  };

  const handleEmergencyStop = async () => {
    setIsStopping(true);
    addLog("GLOBAL EMERGENCY STOP TRIGGERED BY OPERATOR", "error");
    try {
      await apiService.sendEmergencyStop("Global Operator Header Action");
      addLog("Emergency stop command dispatched to robot firmware", "warning");
    } catch (err) {
      console.error("Emergency stop failed:", err);
    } finally {
      setIsStopping(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Authenticating SARAS Operator...
          </p>
        </div>
      </div>
    );
  }

  const isRobotOnline = wsConnected && telemetry.robotConnected === true;
  const isEmergency =
    telemetry.emergencyStop === true || telemetry.flameDetected === true;

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Mission",
      href: "/mission",
      icon: MapPin,
    },
    {
      name: "Manual Control",
      href: "/control",
      icon: Gamepad2,
    },
    {
      name: "Sensors",
      href: "/sensors",
      icon: Activity,
    },
    {
      name: "Netra Phone",
      href: "/phone",
      icon: Smartphone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Realtime WebSocket Manager (Singleton) */}
      <RealtimeManager />

      {/* ================= HIGH PRIORITY ALERT BANNERS ================= */}
      {telemetry.flameDetected && (
        <div className="bg-red-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-2 animate-pulse">
          <Flame size={16} />
          <span>EMERGENCY CONDITION: Optical flame sensor triggered active fire alarm!</span>
        </div>
      )}

      {operatorContact && (
        <div className="bg-amber-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="animate-bounce" />
            <span>OPERATOR CONTACT REQUESTED: Netra Android phone requested voice / emergency support!</span>
          </div>
          <button
            type="button"
            onClick={() => setOperatorContact(false)}
            className="rounded bg-black/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider hover:bg-black/60 transition"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ================= HEADER / TOP COMMAND BAR ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B1222]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Branding & Status */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 transition">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black tracking-wider text-white">
                    SARAS-01
                  </span>
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                    ROVER
                  </span>
                </div>
                <p className="text-[10px] tracking-wide text-slate-400 hidden sm:block">
                  Search & Rescue Automated System
                </p>
              </div>
            </Link>

            {/* Comms & Robot Status Badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-800 bg-[#070D1C] px-2.5 py-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isEmergency
                    ? "bg-red-500 animate-ping"
                    : isRobotOnline
                      ? "bg-green-400 animate-pulse"
                      : wsConnected
                        ? "bg-yellow-400"
                        : "bg-slate-600"
                }`}
              />
              <span className="font-mono text-[11px] font-bold">
                {isEmergency
                  ? "EMERGENCY"
                  : isRobotOnline
                    ? "ROVER ONLINE"
                    : wsConnected
                      ? "STATION ACTIVE"
                      : "OFFLINE"}
              </span>
            </div>

            {/* Battery Indicator */}
            {telemetry.batteryLevel !== null && (
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#070D1C] px-2.5 py-1.5 text-xs font-mono">
                {telemetry.batteryLevel <= 20 ? (
                  <BatteryWarning size={14} className="text-red-400 animate-pulse" />
                ) : (
                  <Battery size={14} className="text-green-400" />
                )}
                <span className="font-bold text-white">
                  {telemetry.batteryLevel.toFixed(0)}%
                </span>
                {telemetry.batteryVoltage != null && (
                  <span className="text-[10px] text-slate-500">
                    ({telemetry.batteryVoltage.toFixed(1)}V)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Emergency Stop & Operator Profile */}
          <div className="flex items-center gap-3">
            {/* Global Emergency STOP Button */}
            <button
              type="button"
              onClick={handleEmergencyStop}
              disabled={isStopping}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/50 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 shadow-lg shadow-red-600/30 active:scale-95 transition"
            >
              <AlertOctagon size={15} />
              <span className="tracking-wide">E-STOP</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs text-slate-400 hover:border-slate-700 hover:text-white transition"
            >
              <LogOut size={13} />
              <span className="text-[11px]">Logout</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#070D1C] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">Operator: admin</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-400 flex items-center gap-1 font-semibold"
              >
                <LogOut size={12} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Global Status Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070D1C] px-4 py-2.5 text-[11px] text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-500">SARAS CONTROL v2.0</span>
            <span>•</span>
            <span>Firmware Target: ESP8266 + MPU6050</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">SIH 2026</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span>WS: {wsConnected ? "CONNECTED" : "DISCONNECTED"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
