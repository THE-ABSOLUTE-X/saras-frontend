"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Bell,
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Crosshair,
  Gauge,
  Loader2,
  LogOut,
  Map,
  Menu,
  Radio,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import SensorStatus from "@/components/sensors/SensorStatus";
import AlertsPanel from "@/components/alerts/AlertsPannel";
import SarasMap, { type SearchAreaInfo } from "@/components/map/Sarasmap";
import RobotControl from "@/components/controls/RobotControl";
import MissionStatus, {
  type MissionSubmissionStatus,
} from "@/components/mission/MissionStatus";
import ActivityLog, {
  type LogEntry,
  type LogType,
} from "@/components/logs/ActivityLog";
import type { TelemetryData } from "@/types/telemetry";

function formatLatitude(lat: number | null | undefined): string {
  if (lat === null || lat === undefined || !Number.isFinite(lat)) {
    return "--";
  }
  const dir = lat >= 0 ? "N" : "S";
  return `${Math.abs(lat).toFixed(6)}° ${dir}`;
}

function formatLongitude(lng: number | null | undefined): string {
  if (lng === null || lng === undefined || !Number.isFinite(lng)) {
    return "--";
  }
  const dir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lng).toFixed(6)}° ${dir}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    timestamp: null,
    latitude: null,
    longitude: null,
    temperature: null,
    humidity: null,
    gasLevel: null,
    flameDetected: null,
    ultrasonicDistance: null,
    batteryLevel: null,
    robotConnected: null,
    robotStatus: null,
    sequence: null,
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [operatorContact, setOperatorContact] = useState(false);
  const [searchArea, setSearchArea] = useState<SearchAreaInfo | null>(null);
  const [submissionStatus, setSubmissionStatus] =
    useState<MissionSubmissionStatus>("NOT_SELECTED");
  const [missionId, setMissionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const wsTelemetryReceivedRef = useRef<boolean>(false);

  const addLog = useCallback((message: string, type: LogType = "info") => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setActivityLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time: timeStr,
        message,
        type,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const handleSearchAreaSelect = (area: SearchAreaInfo | null) => {
    setSearchArea(area);
    if (area) {
      setSubmissionStatus("SELECTED");
      setStatusMessage(
        `Search rectangle defined: ${Math.round(area.widthMeters)}m × ${Math.round(area.heightMeters)}m (${Math.round(area.areaSquareMeters)} m²). Ready to submit for backend validation.`
      );
      addLog(
        `Search area defined on map: ${Math.round(area.widthMeters)}m × ${Math.round(area.heightMeters)}m`,
        "info"
      );
    } else {
      setSubmissionStatus("NOT_SELECTED");
      setStatusMessage(null);
      setMissionId(null);
    }
  };

  const handleSubmitSearchArea = async () => {
    if (!searchArea) return;

    setSubmissionStatus("VERIFYING");
    setStatusMessage(
      "Verifying search area with POST http://localhost:8000/api/v1/missions..."
    );
    addLog("Submitting search area for backend mission validation...", "info");

    const payload = {
      robotId: "SARAS-01",
      searchArea: {
        boundary: [
          { latitude: searchArea.south, longitude: searchArea.west },
          { latitude: searchArea.south, longitude: searchArea.east },
          { latitude: searchArea.north, longitude: searchArea.east },
          { latitude: searchArea.north, longitude: searchArea.west },
        ],
      },
    };

    try {
      const response = await fetch("http://localhost:8000/api/v1/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "saras-dev-key",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errData = await response.json().catch(() => null);
          const reason = errData?.detail?.reason || "validation_failed";
          const details = errData?.detail?.details
            ? ` (${JSON.stringify(errData.detail.details)})`
            : "";
          setSubmissionStatus("REJECTED");
          setStatusMessage(
            `Search area rejected (HTTP 422): ${reason}${details}`
          );
          addLog(`Search area rejected by backend: ${reason}`, "warning");
          return;
        }

        const errText = await response.text().catch(() => "");
        setSubmissionStatus("ERROR");
        setStatusMessage(
          `Backend verification request failed (${response.status}): ${errText}`
        );
        addLog(`Mission validation error (${response.status})`, "error");
        return;
      }

      const createdMission = await response.json();
      const createdId = createdMission.missionId;
      setMissionId(createdId);

      let verifiedStatus = createdMission.status;
      try {
        const getRes = await fetch(
          `http://localhost:8000/api/v1/missions/${createdId}`,
          {
            headers: {
              "X-API-Key": "saras-dev-key",
            },
          }
        );
        if (getRes.ok) {
          const fetched = await getRes.json();
          verifiedStatus = fetched.status || verifiedStatus;
        }
      } catch (getErr) {
        console.warn("GET verification fetch failed:", getErr);
      }

      setSubmissionStatus("VERIFIED");
      setStatusMessage(
        `SEARCH AREA VERIFIED: Backend mission validation accepted the submitted search area. Mission ID: ${createdId} (Status: ${verifiedStatus})`
      );
      addLog(
        `Search area verified by backend. Mission ID: ${createdId}`,
        "success"
      );
    } catch (networkError: unknown) {
      console.error("Backend connection error:", networkError);
      setSubmissionStatus("ERROR");
      setStatusMessage(
        "Cannot connect to SARAS backend (http://localhost:8000). Ensure the backend server is running."
      );
      addLog("Cannot connect to SARAS backend (HTTP offline)", "error");
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    const hydrateInitialTelemetry = async () => {
      try {
        const res = await fetch(
          "/api/backend/v1/robots/SARAS-01/state",
          {
            signal: abortController.signal,
            headers: {
              "X-API-Key": "saras-dev-key",
            },
          }
        );

        if (!res.ok) {
          console.warn(
            `Initial telemetry hydration failed with status ${res.status}`
          );
          return;
        }

        const data = await res.json();
        const initialTelemetry: Partial<TelemetryData> | null =
          data?.telemetry ?? null;

        if (!initialTelemetry || !isMountedRef.current) {
          return;
        }

        setTelemetry((prev) => {
          // If live WebSocket telemetry has already arrived, guard against overwriting with stale REST data
          if (wsTelemetryReceivedRef.current) {
            if (
              prev.sequence !== null &&
              initialTelemetry.sequence !== null &&
              initialTelemetry.sequence !== undefined &&
              initialTelemetry.sequence < prev.sequence
            ) {
              return prev;
            }

            if (prev.timestamp && initialTelemetry.timestamp) {
              const prevTime = new Date(prev.timestamp).getTime();
              const initialTime = new Date(initialTelemetry.timestamp).getTime();
              if (
                Number.isFinite(prevTime) &&
                Number.isFinite(initialTime) &&
                initialTime < prevTime
              ) {
                return prev;
              }
            }

            // Merge safely: preserve live WebSocket fields in prev over REST
            return {
              ...initialTelemetry,
              ...prev,
            };
          }

          // Otherwise, hydrate state with initial REST telemetry
          return {
            ...prev,
            ...initialTelemetry,
          };
        });

        addLog("Initial telemetry hydrated from SARAS backend", "info");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.warn("Initial telemetry hydration network error:", err);
      }
    };

    hydrateInitialTelemetry();

    const connect = () => {
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      try {
        const ws = new WebSocket("ws://localhost:8000/ws/robots/SARAS-01");
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) {
            ws.close();
            return;
          }
          setWsConnected(true);
          addLog(
            "Control station connected to SARAS backend (ws://localhost:8000)",
            "success"
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "connected") {
              setWsConnected(true);
              addLog(
                `Control station verified with SARAS backend (${message.robotId || "SARAS-01"})`,
                "success"
              );
            } else if (message.type === "telemetry" && message.data) {
              wsTelemetryReceivedRef.current = true;
              setTelemetry((prev) => ({
                ...prev,
                ...message.data,
              }));
            } else if (message.type === "operator_contact") {
              setOperatorContact(true);
              addLog("Emergency operator contact requested by Netra", "warning");
            } else if (message.type === "phone_telemetry" && message.data) {
              setTelemetry((prev) => ({
                ...prev,
                ...message.data,
              }));
            } else if (message.type === "video_frame") {
              // Future camera stream frame handling
            }
          } catch (error) {
            console.warn("Telemetry parse warning:", error);
          }
        };

        ws.onerror = (event) => {
          // Log as warning rather than error to avoid Next.js dev error overlay
          console.warn("WebSocket connection warning:", event);
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (socketRef.current === ws) {
            socketRef.current = null;
          }

          if (isMountedRef.current) {
            addLog(
              "SARAS WebSocket disconnected. Reconnecting in 2.5s...",
              "warning"
            );
            if (!reconnectTimerRef.current) {
              reconnectTimerRef.current = setTimeout(() => {
                reconnectTimerRef.current = null;
                if (isMountedRef.current) {
                  connect();
                }
              }, 2500);
            }
          }
        };
      } catch (err) {
        console.warn("WebSocket initialization warning:", err);
        setWsConnected(false);
        if (isMountedRef.current && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (isMountedRef.current) {
              connect();
            }
          }, 2500);
        }
      }
    };

    // Use a small delay (50ms) to allow React Strict Mode's rapid mount/unmount cycle to complete
    // without initiating and instantly aborting a WebSocket in CONNECTING state.
    connectTimerRef.current = setTimeout(() => {
      connectTimerRef.current = null;
      if (isMountedRef.current) {
        connect();
      }
    }, 50);

    return () => {
      isMountedRef.current = false;
      abortController.abort();

      if (connectTimerRef.current) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // Closing while CONNECTING triggers browser warning; wait for open then close cleanly
          ws.onopen = () => {
            ws.close();
          };
        }
      }
    };
  }, [addLog]);

  const handleLogout = () => {
    router.push("/login");
  };

  const isRobotOnline = wsConnected && telemetry.robotConnected === true;
  const hasGps =
    telemetry.latitude !== null &&
    telemetry.longitude !== null &&
    Number.isFinite(telemetry.latitude) &&
    Number.isFinite(telemetry.longitude);

  const batteryValue =
    telemetry.batteryLevel !== null
      ? `${telemetry.batteryLevel.toFixed(0)}%`
      : "--";
  const batteryStatus =
    telemetry.batteryLevel === null
      ? "UNAVAILABLE"
      : telemetry.batteryLevel > 50
        ? "HEALTHY"
        : telemetry.batteryLevel > 20
          ? "WARNING"
          : "CRITICAL";
  const batteryStatusType: "success" | "warning" | "danger" | "neutral" =
    telemetry.batteryLevel === null
      ? "neutral"
      : telemetry.batteryLevel > 50
        ? "success"
        : telemetry.batteryLevel > 20
          ? "warning"
          : "danger";

  const rawRobotStatus = telemetry.robotStatus
    ? String(telemetry.robotStatus).toLowerCase()
    : null;
  const formattedRobotStatus = rawRobotStatus
    ? rawRobotStatus.toUpperCase()
    : "N/A";
  const robotStatusClass =
    rawRobotStatus === "active"
      ? "text-green-400"
      : rawRobotStatus === "warning"
        ? "text-yellow-400"
        : rawRobotStatus === "offline"
          ? "text-red-400"
          : "text-slate-300";

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

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isRobotOnline ? "bg-green-500/10" : "bg-slate-800/40"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRobotOnline ? "bg-green-400" : "bg-slate-600"
              }`}
            />
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
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isRobotOnline ? "bg-green-400" : "bg-slate-600"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        isRobotOnline ? "text-green-400" : "text-slate-500"
                      }`}
                    >
                      {isRobotOnline ? "Online" : "Offline"}
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

              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  isRobotOnline
                    ? "border-green-500/15 bg-green-500/5 text-green-400"
                    : "border-slate-800 bg-slate-900/60 text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRobotOnline ? "bg-green-400" : "bg-slate-600"
                  }`}
                />
                <span className="text-xs font-medium">
                  {isRobotOnline
                    ? "SYSTEM ONLINE"
                    : wsConnected
                      ? "ROVER OFFLINE"
                      : "SYSTEM OFFLINE"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2">
                <ShieldCheck
                  size={16}
                  className={wsConnected ? "text-cyan-400" : "text-slate-600"}
                />
                <span className="text-xs text-slate-300">
                  {wsConnected ? "Control Connected" : "Control N/A"}
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

              <div
                className={`flex w-fit items-center gap-2 rounded-lg border px-3.5 py-2 ${
                  wsConnected
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <ShieldCheck
                  size={16}
                  className={wsConnected ? "text-green-400" : "text-slate-500"}
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Control
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      wsConnected ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {wsConnected ? "CONNECTED" : "N/A"}
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
                status={isRobotOnline ? "ONLINE" : wsConnected ? "OFFLINE" : "DISCONNECTED"}
                statusType={isRobotOnline ? "success" : "neutral"}
              />

              <StatusCard
                icon={<BatteryMedium size={18} />}
                label="BATTERY"
                value={batteryValue}
                status={batteryStatus}
                statusType={batteryStatusType}
              />

              <StatusCard
                icon={<CircleGauge size={18} />}
                label="SPEED"
                value="--"
                status="NO DATA"
                statusType="neutral"
              />

              <StatusCard
                icon={<Wifi size={18} />}
                label="HEARTBEAT"
                value="--"
                status="NO LATENCY DATA"
                statusType="neutral"
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

                  <div className="flex items-center gap-2">
                    {submissionStatus === "VERIFYING" && (
                      <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5">
                        <Loader2 size={11} className="animate-spin text-yellow-400" />
                        <span className="text-[10px] font-semibold text-yellow-400">
                          VERIFYING SEARCH AREA...
                        </span>
                      </div>
                    )}
                    {submissionStatus === "VERIFIED" && (
                      <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
                        <CheckCircle2 size={11} className="text-green-400" />
                        <span className="text-[10px] font-semibold text-green-400">
                          SEARCH AREA VERIFIED {missionId ? `• ${missionId}` : ""}
                        </span>
                      </div>
                    )}
                    {submissionStatus === "REJECTED" && (
                      <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                        <AlertTriangle size={11} className="text-red-400" />
                        <span className="text-[10px] font-semibold text-red-400">
                          SEARCH AREA REJECTED
                        </span>
                      </div>
                    )}
                    {submissionStatus === "ERROR" && (
                      <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                        <WifiOff size={11} className="text-red-400" />
                        <span className="text-[10px] font-semibold text-red-400">
                          VERIFICATION ERROR
                        </span>
                      </div>
                    )}
                    {submissionStatus === "SELECTED" && (
                      <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-cyan-400">
                          AREA SELECTED
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                        hasGps
                          ? "border-green-500/15 bg-green-500/5 text-green-400"
                          : "border-slate-800 bg-slate-900/60 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasGps ? "bg-green-400" : "bg-slate-600"
                        }`}
                      />
                      <span className="text-[10px] font-medium">
                        {hasGps ? "GPS ACTIVE" : "GPS UNAVAILABLE"}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="relative h-[420px] w-full overflow-hidden bg-slate-950 sm:h-[480px]">

                  <SarasMap
                    latitude={telemetry.latitude}
                    longitude={telemetry.longitude}
                    onSearchAreaSelect={handleSearchAreaSelect}
                  />

                  {/* Position overlay */}
                  <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-slate-700/80 bg-[#080D18]/90 px-4 py-3 shadow-xl backdrop-blur-md">

                    <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-500">
                      CURRENT POSITION
                    </p>

                    <div className="mt-1 flex gap-3">
                      {hasGps ? (
                        <>
                          <p className="font-mono text-xs text-slate-200">
                            {formatLatitude(telemetry.latitude)}
                          </p>

                          <p className="font-mono text-xs text-slate-400">
                            {formatLongitude(telemetry.longitude)}
                          </p>
                        </>
                      ) : (
                        <p className="font-mono text-xs text-slate-400">
                          GPS unavailable
                        </p>
                      )}
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
                <MissionStatus
                  searchArea={searchArea}
                  submissionStatus={submissionStatus}
                  missionId={missionId}
                  statusMessage={statusMessage}
                  onSubmitArea={handleSubmitSearchArea}
                />
              </div>

            </div>

            {/* ================= ROBOT CONTROL CENTER ================= */}
            <section className="mt-5">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Control Center
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Robot Control
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Manual rover, head and arm control
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    wsConnected
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      wsConnected ? "bg-green-400" : "bg-slate-600"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold ${
                      wsConnected ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {wsConnected ? "CONTROL READY" : "CONTROL N/A"}
                  </span>
                </div>
              </div>

              <RobotControl isOnline={wsConnected} />
            </section>

            {/* ================= ROBOT STATE ================= */}
            <section className="mt-5 rounded-2xl border border-slate-800/80 bg-[#0B1222] p-5">

              <div className="flex items-center justify-between border-b border-slate-800/70 pb-4">

                <div>
                  <p className="text-sm font-semibold text-white">
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

              <div className="mt-2 grid gap-x-8 md:grid-cols-2">

                <InfoRow
                  label="Current State"
                  value={formattedRobotStatus}
                  valueClass={robotStatusClass}
                />

                <InfoRow
                  label="Mission"
                  value={
                    missionId
                      ? `Mission ${missionId}`
                      : submissionStatus === "SELECTED"
                        ? "Area Selected (Unsubmitted)"
                        : "No active mission"
                  }
                />

                <InfoRow
                  label="Control"
                  value={wsConnected ? "Connected" : "N/A"}
                  valueClass={wsConnected ? "text-green-400" : "text-slate-400"}
                />

                <InfoRow
                  label="Connection"
                  value={isRobotOnline ? "Stable" : "Offline"}
                  valueClass={isRobotOnline ? "text-green-400" : "text-slate-400"}
                />

              </div>
            </section>

            {/* ================= SENSOR TELEMETRY ================= */}
            <section className="mt-5">
              <SensorStatus telemetry={telemetry} />
            </section>

            {/* ================= ALERTS + MISSION ================= */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              <AlertsPanel
                telemetry={telemetry}
                wsConnected={wsConnected}
              />

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
                    value={hasGps ? "ACTIVE" : "UNAVAILABLE"}
                    statusType={hasGps ? "success" : "neutral"}
                  />

                  <SystemBadge
                    label="RADIO"
                    value="N/A"
                    statusType="neutral"
                  />

                  <SystemBadge
                    label="SENSORS"
                    value={
                      wsConnected && telemetry.temperature !== null
                        ? "ONLINE"
                        : "NO DATA"
                    }
                    statusType={
                      wsConnected && telemetry.temperature !== null
                        ? "success"
                        : "neutral"
                    }
                  />

                  <SystemBadge
                    label="CONTROL"
                    value={wsConnected ? "READY" : "N/A"}
                    statusType={wsConnected ? "success" : "neutral"}
                  />

                </div>

              </section>

            </div>

            {/* ================= ACTIVITY ================= */}
            <div className="mt-5">
              <ActivityLog logs={activityLogs} />
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
      className={`group mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active
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
  statusType = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  status: string;
  statusType?: "success" | "warning" | "danger" | "neutral";
}) {
  const dotColor =
    statusType === "success"
      ? "bg-green-400"
      : statusType === "warning"
        ? "bg-yellow-400"
        : statusType === "danger"
          ? "bg-red-500"
          : "bg-slate-600";

  const textColor =
    statusType === "success"
      ? "text-green-400"
      : statusType === "warning"
        ? "text-yellow-400"
        : statusType === "danger"
          ? "text-red-400"
          : "text-slate-500";

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
          className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-lg font-semibold tracking-tight">
          {value}
        </p>

        <span className={`text-[9px] font-semibold ${textColor}`}>
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
  statusType = "neutral",
}: {
  label: string;
  value: string;
  statusType?: "success" | "warning" | "danger" | "neutral";
}) {
  const dotColor =
    statusType === "success"
      ? "bg-green-400"
      : statusType === "warning"
        ? "bg-yellow-400"
        : statusType === "danger"
          ? "bg-red-500"
          : "bg-slate-600";

  const textColor =
    statusType === "success"
      ? "text-green-400"
      : statusType === "warning"
        ? "text-yellow-400"
        : statusType === "danger"
          ? "text-red-400"
          : "text-slate-500";

  return (
    <div className="rounded-xl border border-slate-800 bg-[#070C18] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium tracking-wider text-slate-600">
          {label}
        </span>

        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      </div>

      <p className={`mt-2 text-[10px] font-semibold ${textColor}`}>
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
