"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Bell,
  Bot,
  Camera,
  ChevronRight,
  CircleGauge,
  Crosshair,
  Gauge,
  LogOut,
  Map,
  Menu,
  Radio,
  Settings,
  ShieldCheck,
  Wifi,
  X,
} from "lucide-react";

import SensorStatus from "@/components/sensors/SensorStatus";
import AlertsPanel from "@/components/alerts/AlertsPannel";
import SarasMap from "@/components/map/Sarasmap";
import RobotControl from "@/components/controls/RobotControl";
import MissionStatus from "@/components/mission/MissionStatus";
import ActivityLog from "@/components/logs/ActivityLog";

export default function DashboardPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({
  temperature: null as number | null,
  humidity: null as number | null,
  gasLevel: null as number | null,
  flameDetected: null as boolean | null,
  ultrasonicDistance: null as number | null,
  batteryLevel: null as number | null,
});
  const [operatorContact, setOperatorContact] = useState(false);

useEffect(() => {
  const socket = new WebSocket(
    "ws://localhost:8000/ws/robots/SARAS-01"
  );

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "telemetry") {
        setTelemetry(message.data);
      }

      if (message.type === "operator_contact") {
        setOperatorContact(true);
      }
    } catch (error) {
      console.error("Telemetry parse error:", error);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return () => {
    socket.close();
  };
}, []);

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#060A14] text-white">
      {/* ================= MOBILE HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080D1A]/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <div className="text-center">
            <p className="font-mono text-sm font-semibold tracking-[0.3em] text-cyan-400">
              SARAS
            </p>
            <p className="text-[10px] tracking-wider text-slate-500">
              CONTROL CENTER
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
            <span className="h-2 w-2 rounded-full bg-green-400" />
          </div>
        </div>

        {mobileMenuOpen && (
          <MobileNavigation onLogout={handleLogout} />
        )}
      </header>

      <div className="flex min-h-screen">

        {/* ================= SIDEBAR ================= */}
        <aside className="hidden w-[250px] shrink-0 border-r border-slate-800/80 bg-[#0A1020] lg:flex lg:flex-col">

          {/* Robot identity */}
          <div className="border-b border-slate-800/70 p-5">
            <div className="rounded-xl border border-slate-800 bg-[#070C18] p-4">
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/10">
                  <Bot size={23} className="text-cyan-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-wide">
                    SARAS-01
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5">

            <NavHeading title="OPERATIONS" />

            <NavigationItem
              icon={<Map size={18} />}
              label="Dashboard"
              active
            />

            <NavigationItem
              icon={<Crosshair size={18} />}
              label="Mission"
            />

            <NavigationItem
              icon={<Gauge size={18} />}
              label="Robot Control"
            />

            <NavigationItem
              icon={<Activity size={18} />}
              label="Sensors"
            />

            <NavigationItem
              icon={<Camera size={18} />}
              label="Phone / Camera"
            />

            <NavHeading title="MONITORING" />

            <NavigationItem
              icon={<AlertTriangle size={18} />}
              label="Alerts"
            />

            <NavigationItem
              icon={<Radio size={18} />}
              label="Activity Logs"
            />

            <NavHeading title="SYSTEM" />

            <NavigationItem
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>

          {/* Operator / logout */}
          <div className="border-t border-slate-800/70 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-950/60 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-400">
                O
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  Operator
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  Control Station 01
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <section className="min-w-0 flex-1">

          {/* Desktop header */}
          <header className="hidden h-[68px] items-center justify-between border-b border-slate-800/80 bg-[#080D19] px-7 lg:flex">

            <div className="flex items-center gap-3">
              <div>
                <p className="font-mono text-sm font-semibold tracking-[0.28em] text-cyan-400">
                  SARAS
                </p>
                <p className="text-[10px] tracking-[0.18em] text-slate-600">
                  SEARCH & RESCUE AUTONOMOUS SYSTEM
                </p>
              </div>

              <div className="ml-3 h-7 w-px bg-slate-800" />

              <p className="text-xs text-slate-500">
                Operator Control Center
              </p>
            </div>

            <div className="flex items-center gap-3">

              <button className="relative rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white">
                <Bell size={17} />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </button>

              <div className="flex items-center gap-2 rounded-lg border border-green-500/15 bg-green-500/5 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-xs font-medium text-green-400">
                  SYSTEM ONLINE
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2">
                <ShieldCheck size={16} className="text-cyan-400" />
                <span className="text-xs text-slate-300">
                  Control Available
                </span>
              </div>

            </div>
          </header>

          {/* ================= PAGE CONTENT ================= */}
          {operatorContact && (
            <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-3">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">
                      Operator contact requested
                    </p>
                    <p className="text-xs text-red-200/70">
                      Netra has requested attention from Control Station 01.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOperatorContact(false)}
                  className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-7">

            {/* Page heading */}
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <p className="font-mono text-[11px] tracking-[0.25em] text-cyan-400">
                    SARAS-01
                  </p>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Search Operations
                </h1>

                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Monitor rover position, telemetry, mission progress and
                  emergency status from one control interface.
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-2">
                <ShieldCheck size={16} className="text-green-400" />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Control
                  </p>
                  <p className="text-xs font-semibold text-green-400">
                    AVAILABLE
                  </p>
                </div>
              </div>

            </div>

            {/* ================= TELEMETRY ================= */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <StatusCard
                icon={<Bot size={18} />}
                label="ROVER"
                value="SARAS-01"
                status="ONLINE"
                statusType="success"
              />

              <StatusCard
                icon={<BatteryMedium size={18} />}
                label="BATTERY"
                value="82%"
                status="HEALTHY"
                statusType="success"
              />

              <StatusCard
                icon={<CircleGauge size={18} />}
                label="SPEED"
                value="0.0 km/h"
                status="STATIONARY"
                statusType="neutral"
              />

              <StatusCard
                icon={<Wifi size={18} />}
                label="HEARTBEAT"
                value="250 ms"
                status="ACTIVE"
                statusType="success"
              />

            </div>

            {/* ================= MAP + MISSION ================= */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">

              {/* Map */}
              <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0B1222] shadow-2xl shadow-black/10">

                <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">

                  <div>
                    <div className="flex items-center gap-2">
                      <Map size={17} className="text-cyan-400" />

                      <h2 className="text-sm font-semibold">
                        Live Location
                      </h2>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Real-time SARAS position
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-green-500/15 bg-green-500/5 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] font-medium text-green-400">
                      GPS ACTIVE
                    </span>
                  </div>

                </div>

                <div className="relative h-[420px] w-full overflow-hidden bg-slate-950 sm:h-[480px]">

                  <SarasMap
                    latitude={22.5726}
                    longitude={88.3639}
                  />

                  {/* Position overlay */}
                  <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-slate-700/80 bg-[#080D18]/90 px-4 py-3 shadow-xl backdrop-blur-md">

                    <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-500">
                      CURRENT POSITION
                    </p>

                    <div className="mt-1 flex gap-3">
                      <p className="font-mono text-xs text-slate-200">
                        22.5726° N
                      </p>

                      <p className="font-mono text-xs text-slate-400">
                        88.3639° E
                      </p>
                    </div>

                  </div>

                  {/* Map live badge */}
                  <div className="absolute right-4 top-4 z-10 rounded-lg border border-slate-700/70 bg-[#080D18]/90 px-3 py-2 backdrop-blur-md">
                    <p className="text-[9px] text-slate-500">
                      ROVER
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-cyan-400">
                      SARAS-01
                    </p>
                  </div>

                </div>
              </section>

              {/* Mission */}
              <div className="min-w-0">
                <MissionStatus />
              </div>

            </div>

            {/* ================= CONTROL + STATE ================= */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              <div>
                <RobotControl />
              </div>

              <section className="rounded-2xl border border-slate-800/80 bg-[#0B1222] p-5">

                <div className="flex items-center justify-between border-b border-slate-800/70 pb-4">

                  <div>
                    <p className="text-sm font-semibold">
                      Robot State
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Current rover operating state
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                    <Bot size={18} className="text-cyan-400" />
                  </div>

                </div>

                <div className="mt-5 space-y-1">

                  <InfoRow
                    label="Current Command"
                    value="STOP"
                  />

                  <InfoRow
                    label="Mission"
                    value="No active mission"
                  />

                  <InfoRow
                    label="Control"
                    value="Available"
                    valueClass="text-green-400"
                  />

                  <InfoRow
                    label="Connection"
                    value="Stable"
                    valueClass="text-green-400"
                  />

                </div>

              </section>

            </div>

            {/* ================= SENSOR TELEMETRY ================= */}
            <section className="mt-5">
              <SensorStatus telemetry={telemetry} />
            </section>

            {/* ================= ALERTS + MISSION ================= */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              <AlertsPanel />

              <section className="rounded-2xl border border-slate-800/80 bg-[#0B1222] p-5">

                <div className="flex items-center justify-between border-b border-slate-800/70 pb-4">

                  <div>
                    <p className="text-sm font-semibold">
                      Communication Status
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Core SARAS connections
                    </p>
                  </div>

                  <Radio size={18} className="text-cyan-400" />

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <SystemBadge
                    label="GPS"
                    value="ACTIVE"
                  />

                  <SystemBadge
                    label="RADIO"
                    value="CONNECTED"
                  />

                  <SystemBadge
                    label="SENSORS"
                    value="ONLINE"
                  />

                  <SystemBadge
                    label="CONTROL"
                    value="READY"
                  />

                </div>

              </section>

            </div>

            {/* ================= ACTIVITY ================= */}
            <div className="mt-5">
              <ActivityLog />
            </div>

            {/* ================= FOOTER ================= */}
            <div className="mt-5 flex flex-col gap-2 border-t border-slate-800/70 pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">

              <p>
                SARAS Autonomous Search & Rescue System
              </p>

              <p className="font-mono">
                SYSTEM v1.0 • CONTROL STATION 01
              </p>

            </div>

          </div>
        </section>
      </div>
    </main>
  );
}


/* ================================================= */
/* NAVIGATION                                        */
/* ================================================= */

function NavHeading({ title }: { title: string }) {
  return (
    <p className="mb-2 mt-5 px-3 text-[9px] font-bold tracking-[0.22em] text-slate-600 first:mt-0">
      {title}
    </p>
  );
}


function NavigationItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`group mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/10"
          : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
      }`}
    >
      <span
        className={
          active
            ? "text-cyan-400"
            : "text-slate-600 group-hover:text-slate-300"
        }
      >
        {icon}
      </span>

      <span>{label}</span>

      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
      )}
    </button>
  );
}


/* ================================================= */
/* STATUS CARD                                       */
/* ================================================= */

function StatusCard({
  icon,
  label,
  value,
  status,
  statusType,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  status: string;
  statusType: "success" | "neutral";
}) {
  return (
    <div className="group rounded-xl border border-slate-800/80 bg-[#0B1222] p-4 transition hover:border-slate-700">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-cyan-400/80">
            {icon}
          </span>

          <span className="text-[10px] font-medium tracking-wider">
            {label}
          </span>
        </div>

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            statusType === "success"
              ? "bg-green-400"
              : "bg-slate-600"
          }`}
        />

      </div>

      <div className="mt-4 flex items-end justify-between gap-2">

        <p className="text-lg font-semibold tracking-tight">
          {value}
        </p>

        <span
          className={
            statusType === "success"
              ? "text-[9px] font-semibold text-green-400"
              : "text-[9px] font-semibold text-slate-500"
          }
        >
          {status}
        </span>

      </div>
    </div>
  );
}


/* ================================================= */
/* INFO ROW                                          */
/* ================================================= */

function InfoRow({
  label,
  value,
  valueClass = "text-slate-200",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/50 py-3 last:border-0">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className={`text-right text-xs font-medium ${valueClass}`}>
        {value}
      </span>

    </div>
  );
}


/* ================================================= */
/* SYSTEM BADGE                                      */
/* ================================================= */

function SystemBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#070C18] p-3">

      <div className="flex items-center justify-between">

        <span className="text-[9px] font-medium tracking-wider text-slate-600">
          {label}
        </span>

        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

      </div>

      <p className="mt-2 text-[10px] font-semibold text-green-400">
        {value}
      </p>

    </div>
  );
}


/* ================================================= */
/* MOBILE NAVIGATION                                 */
/* ================================================= */

function MobileNavigation({
  onLogout,
}: {
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-slate-800 bg-[#0A1020] px-4 py-4">

      <div className="grid gap-1">

        <NavigationItem
          icon={<Map size={18} />}
          label="Dashboard"
          active
        />

        <NavigationItem
          icon={<Crosshair size={18} />}
          label="Mission"
        />

        <NavigationItem
          icon={<Gauge size={18} />}
          label="Robot Control"
        />

        <NavigationItem
          icon={<Activity size={18} />}
          label="Sensors"
        />

        <NavigationItem
          icon={<Camera size={18} />}
          label="Phone / Camera"
        />

        <NavigationItem
          icon={<AlertTriangle size={18} />}
          label="Alerts"
        />

        <NavigationItem
          icon={<Radio size={18} />}
          label="Activity Logs"
        />

        <NavigationItem
          icon={<Settings size={18} />}
          label="Settings"
        />

      </div>

      <button
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut size={18} />

        Logout

        <ChevronRight
          size={16}
          className="ml-auto"
        />
      </button>

    </div>
  );
}
