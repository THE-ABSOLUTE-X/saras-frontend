"use client";

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import SarasMap, { type SearchAreaInfo } from "@/components/map/Sarasmap";
import RoverViewer from "@/components/3d/RoverViewer";
import SensorStatus from "@/components/sensors/SensorStatus";
import AlertsPanel from "@/components/alerts/AlertsPannel";
import ActivityLog from "@/components/logs/ActivityLog";
import MissionStatus from "@/components/mission/MissionStatus";
import { useRobotStore } from "@/stores/useRobotStore";
import { apiService } from "@/services/apiService";
import {
  Compass,
  Video,
  VideoOff,
  Battery,
  Flame,
  Activity,
  ArrowRight,
  Gamepad2,
} from "lucide-react";

function formatCoordinate(val: number | null | undefined, posSuffix: string, negSuffix: string): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return "--";
  const suffix = val >= 0 ? posSuffix : negSuffix;
  return `${Math.abs(val).toFixed(6)}° ${suffix}`;
}

function parseCoordinate(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

export default function DashboardPage() {
  const {
    telemetry,
    phoneTelemetry,
    wsConnected,
    videoFrame,
    searchArea,
    setSearchArea,
    missionStatus,
    missionId,
    missionMessage,
    setMissionStatus,
    logs,
    addLog,
  } = useRobotStore();

  const isRobotOnline = wsConnected && telemetry.robotConnected === true;

  // Defensive GPS resolution: Phone GPS is primary, rover GPS is fallback
  const phoneLat = parseCoordinate(phoneTelemetry.latitude, -90, 90);
  const phoneLng = parseCoordinate(phoneTelemetry.longitude, -180, 180);
  const hasPhoneGps = phoneLat !== null && phoneLng !== null;

  const roverLat = parseCoordinate(telemetry.latitude, -90, 90);
  const roverLng = parseCoordinate(telemetry.longitude, -180, 180);
  const hasRoverGps = roverLat !== null && roverLng !== null;

  const effectiveLatitude = hasPhoneGps ? phoneLat : hasRoverGps ? roverLat : null;
  const effectiveLongitude = hasPhoneGps ? phoneLng : hasRoverGps ? roverLng : null;
  const hasGps = effectiveLatitude !== null && effectiveLongitude !== null;

  const handleSearchAreaSelect = (area: SearchAreaInfo | null) => {
    setSearchArea(area);
    if (area) {
      addLog(
        `Search rectangle selected on map: ${Math.round(area.widthMeters)}m × ${Math.round(
          area.heightMeters
        )}m`,
        "info"
      );
    }
  };

  const handleSubmitSearchArea = async () => {
    if (!searchArea) return;

    setMissionStatus("VERIFYING", "Validating search area with backend...");
    addLog("Submitting search area for backend validation...", "info");

    try {
      const result = await apiService.submitMission(searchArea, "SARAS-01");
      if (!result.ok) {
        setMissionStatus(
          "REJECTED",
          `Search area validation rejected: ${result.reason}`
        );
        addLog(`Mission validation rejected: ${result.reason}`, "warning");
        return;
      }

      const createdId = result.mission?.missionId || "SARAS-M001";
      setMissionStatus(
        "VERIFIED",
        `Search area accepted and verified! Mission ID: ${createdId}`,
        createdId
      );
      addLog(`Search area verified successfully (${createdId})`, "success");
    } catch (err) {
      setMissionStatus(
        "ERROR",
        `Backend request failed: ${err instanceof Error ? err.message : String(err)}`
      );
      addLog("Mission validation error", "error");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Comms & Status */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                System Link
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isRobotOnline ? "bg-green-400 animate-pulse" : "bg-red-500"
                }`}
              />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xl font-bold text-white">
                {isRobotOnline ? "ROVER ONLINE" : wsConnected ? "STATION STANDBY" : "OFFLINE"}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {wsConnected ? "WebSocket link active" : "Reconnecting to backend"}
              </p>
            </div>
          </div>

          {/* Card 2: Battery */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Power Level
              </span>
              <Battery size={15} className="text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xl font-bold text-white">
                {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel.toFixed(0)}%` : "--"}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {telemetry.batteryVoltage ? `${telemetry.batteryVoltage.toFixed(1)}V Bus Rail` : "Li-Ion System"}
              </p>
            </div>
          </div>

          {/* Card 3: Hazard & Flame Status */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Fire Safety
              </span>
              <Flame
                size={15}
                className={
                  telemetry.flameDetected
                    ? "text-red-400 animate-pulse"
                    : "text-slate-500"
                }
              />
            </div>
            <div className="mt-2">
              <span
                className={`font-mono text-xl font-bold ${
                  telemetry.flameDetected ? "text-red-400" : "text-white"
                }`}
              >
                {telemetry.flameDetected ? "FLAME DETECTED" : "ALL CLEAR"}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Optical Flame Sensor
              </p>
            </div>
          </div>

          {/* Card 4: Obstacle Clearance */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Front Clearance
              </span>
              <Activity size={15} className="text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xl font-bold text-white">
                {telemetry.ultrasonicDistance !== null
                  ? `${telemetry.ultrasonicDistance.toFixed(1)} cm`
                  : "--"}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                HC-SR04 Rangefinder
              </p>
            </div>
          </div>
        </div>

        {/* Main Command Grid: Left (Map + Mission) | Right (Camera + 3D Attitude + Control link) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): MapLibre Tactical Map */}
          <div className="lg:col-span-7 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1222] shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Tactical MapLibre GIS
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-400">
                    GPS: {hasGps ? `${formatCoordinate(effectiveLatitude, "N", "S")}, ${formatCoordinate(effectiveLongitude, "E", "W")}` : "SEARCHING"}
                  </span>
                  <Link
                    href="/mission"
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>Full Mission</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <div className="relative h-[440px] w-full bg-slate-950">
                <SarasMap
                  latitude={effectiveLatitude}
                  longitude={effectiveLongitude}
                  onSearchAreaSelect={handleSearchAreaSelect}
                />
              </div>
            </div>

            {/* Quick Mission Submission Card */}
            <MissionStatus
              searchArea={searchArea}
              submissionStatus={missionStatus}
              missionId={missionId}
              statusMessage={missionMessage}
              onSubmitArea={handleSubmitSearchArea}
            />
          </div>

          {/* Right Column (5 cols): Camera + 3D Orientation + Controls Banner */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Camera Feed */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Video size={15} className="text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Rover Forward Vision
                  </span>
                </div>
                <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                  {videoFrame ? "STREAM LIVE" : "STANDBY"}
                </span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
                {videoFrame ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/jpeg;base64,${videoFrame}`}
                    alt="Live Stream"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <VideoOff size={28} />
                    <p className="font-mono text-xs">Waiting for video stream</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compact 3D Rover Attitude Widget */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Compass size={15} className="text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    3D Orientation (MPU6050)
                  </span>
                </div>
                <Link
                  href="/control"
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px] font-mono"
                >
                  <span>Manual Drive</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <RoverViewer
                roll={telemetry.roll}
                pitch={telemetry.pitch}
                compact={true}
                className="h-[210px] w-full"
              />
            </div>

            {/* Quick Teleoperation Launch Link */}
            <Link
              href="/control"
              className="flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-[#0B1222] p-4 text-cyan-300 hover:border-cyan-400 transition group shadow-lg shadow-cyan-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    Manual Teleoperation Station
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Launch continuous joystick & servo arm control
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>

        {/* Bottom Section: Sensors Summary, Alerts, and Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SensorStatus telemetry={telemetry} />
          <AlertsPanel telemetry={telemetry} wsConnected={wsConnected} />
        </div>

        {/* Activity Log */}
        <ActivityLog logs={logs} />
      </div>
    </AppShell>
  );
}
