"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useRobotStore } from "@/stores/useRobotStore";
import {
  Smartphone,
  MapPin,
  Video,
  VideoOff,
  UserCheck,
  UserX,
  AlertTriangle,
  Battery,
  Wifi,
  Radio,
  Volume2,
  Shield,
  Camera,
  Mic,
  Compass,
} from "lucide-react";

export default function PhonePage() {
  const {
    phoneTelemetry,
    videoFrame,
    operatorContact,
    setOperatorContact,
    addLog,
  } = useRobotStore();

  const isPersonDetected = Boolean(phoneTelemetry.personDetected);
  const personCount =
    phoneTelemetry.personCount !== undefined && phoneTelemetry.personCount !== null
      ? phoneTelemetry.personCount
      : isPersonDetected
      ? 1
      : 0;

  // Track the most recent detection time during the session using React previous-render comparison
  const [lastDetectionTime, setLastDetectionTime] = useState<string | null>(null);
  const [prevDetectionKey, setPrevDetectionKey] = useState<string | null>(null);

  const currentDetectionKey = isPersonDetected
    ? `${phoneTelemetry.timestamp || "live"}-${phoneTelemetry.personCount || 1}`
    : null;

  if (currentDetectionKey && currentDetectionKey !== prevDetectionKey) {
    setPrevDetectionKey(currentDetectionKey);
    setLastDetectionTime(
      phoneTelemetry.timestamp
        ? new Date(phoneTelemetry.timestamp).toLocaleTimeString()
        : "Live Frame"
    );
  }

  const hasGps =
    phoneTelemetry.latitude !== undefined &&
    phoneTelemetry.latitude !== null &&
    phoneTelemetry.longitude !== undefined &&
    phoneTelemetry.longitude !== null;

  const latNum = Number(phoneTelemetry.latitude);
  const lngNum = Number(phoneTelemetry.longitude);

  const handleAcknowledge = () => {
    setOperatorContact(false);
    addLog("Netra operator contact acknowledged by command station", "info");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                SARAS Auxiliary Subsystem
              </span>
              <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-400">
                NETRA RECON NODE
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Netra Android Reconnaissance Subsystem
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Independent Android payload providing tactical WGS84 GPS, high-resolution vision, ML Kit person detection, and emergency intercom.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0B1222] px-3.5 py-2 font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-400">UPLINK: </span>
              <span className="text-white font-bold">DIRECT BACKEND WS</span>
            </div>
          </div>
        </div>

        {/* Subsystem Isolation Architecture Card */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 text-xs font-mono text-blue-300 flex items-start gap-3">
          <Shield size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white uppercase block">
              Subsystem Isolation Architecture:
            </span>
            <p className="mt-0.5 text-blue-200/80 leading-relaxed">
              Netra operates as an autonomous sensor station. It connects directly to the SARAS backend server over WebSocket/REST and is not dependent on the ESP8266 rover drive microcontroller.
            </p>
          </div>
        </div>

        {/* Emergency Intercom Alert if active */}
        {operatorContact && (
          <div className="rounded-2xl border border-amber-500/50 bg-amber-500/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 animate-bounce">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm uppercase font-mono">
                  Operator Contact Active
                </h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  Field rescue personnel requested voice connection or emergency assistance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcknowledge}
              className="rounded-xl bg-amber-500 px-4 py-2 font-mono text-xs font-bold text-black shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition"
            >
              Acknowledge Call
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEDICATED PERSON DETECTION / HUMAN PRESENCE PANEL                          */}
        {/* ========================================================================= */}
        {isPersonDetected ? (
          /* DETECTION STATE: Prominent Red Alert Styling */
          <div className="rounded-2xl border-2 border-red-500/90 bg-gradient-to-r from-red-950/80 via-red-900/40 to-[#0B1222] p-5 shadow-2xl shadow-red-950/70 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/40 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/50">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-900/60 px-2 py-0.5 rounded border border-red-500/50">
                      CRITICAL RECON ALERT
                    </span>
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                    Person Detection / Human Presence Active
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-red-200 bg-red-900/40 border border-red-500/30 px-3 py-1 rounded-lg">
                  DETECTOR: <strong className="text-white">STREAM_MODE ACTIVE</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3">
                <span className="text-[10px] text-red-300/80 uppercase block">Target Status</span>
                <span className="mt-1 text-base font-black text-red-200 block">
                  PERSON DETECTED
                </span>
                <span className="text-[10px] text-red-400 mt-0.5 block">Visual Confirmation</span>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3">
                <span className="text-[10px] text-red-300/80 uppercase block">Count</span>
                <span className="mt-1 text-2xl font-black text-white block">
                  {personCount}
                </span>
                <span className="text-[10px] text-red-400 mt-0.5 block">
                  {personCount === 1 ? "Subject Isolated" : "Subjects Identified"}
                </span>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3">
                <span className="text-[10px] text-red-300/80 uppercase block">Confidence</span>
                <span className="mt-1 text-base font-bold text-white block">
                  {phoneTelemetry.confidence !== undefined && phoneTelemetry.confidence !== null
                    ? `${(Number(phoneTelemetry.confidence) * 100).toFixed(0)}%`
                    : "Landmark Confirmed"}
                </span>
                <span className="text-[10px] text-red-300/70 mt-0.5 block">ML Kit Pose</span>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3">
                <span className="text-[10px] text-red-300/80 uppercase block">Timestamp</span>
                <span className="mt-1 text-base font-bold text-white block">
                  {phoneTelemetry.timestamp
                    ? new Date(phoneTelemetry.timestamp).toLocaleTimeString()
                    : "Live Frame"}
                </span>
                <span className="text-[10px] text-red-300/70 mt-0.5 block">Real-time Stream</span>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3 col-span-2 md:col-span-1 lg:col-span-2">
                <span className="text-[10px] text-red-300/80 uppercase block">Target Coordinates</span>
                <span className="mt-1 text-sm font-bold text-white block">
                  {hasGps
                    ? `${latNum.toFixed(6)}°, ${lngNum.toFixed(6)}°`
                    : "Acquiring GPS..."}
                </span>
                <span className="text-[10px] text-red-300/70 mt-0.5 block">
                  Source: Netra Android Recon Node
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL STATE: Neutral/Dark Tactical Panel */
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                  <UserX size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      RECON SCANNER IDLE
                    </span>
                    <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                    Person Detection / Human Presence
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  DETECTOR:{" "}
                  <strong className={phoneTelemetry.cameraAvailable ? "text-cyan-400" : "text-slate-500"}>
                    {phoneTelemetry.cameraAvailable ? "ACTIVE SCANNING" : "CAMERA STANDBY"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Target Status</span>
                <span className="mt-1 text-sm font-bold text-slate-300 block">
                  NO PERSON DETECTED
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Sector Clear</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Count</span>
                <span className="mt-1 text-2xl font-black text-slate-400 block">
                  0
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">No Subjects</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                <span className="mt-1 text-base font-bold text-slate-500 block">
                  --
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5 block">Awaiting Detection</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Last Detection</span>
                <span className="mt-1 text-sm font-bold text-slate-300 block truncate">
                  {lastDetectionTime || "None this session"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Session History</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3 col-span-2 md:col-span-1 lg:col-span-2">
                <span className="text-[10px] text-slate-500 uppercase block">Detection System Status</span>
                <span className="mt-1 text-sm font-bold text-slate-200 block">
                  {phoneTelemetry.cameraAvailable
                    ? "ML Kit Pose (2 FPS Sample Relay)"
                    : "Standby / Optical Payload Offline"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Source: Netra Android Recon Node
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Main Grid: Video Stream & GPS / Health Metrics                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Netra Camera Feed */}
          <div
            className={`rounded-2xl border ${
              isPersonDetected ? "border-red-500/60 shadow-xl shadow-red-950/30" : "border-slate-800"
            } bg-[#0B1222] p-5 flex flex-col justify-between transition`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Video size={16} className={isPersonDetected ? "text-red-400" : "text-cyan-400"} />
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Netra Optical Payload
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isPersonDetected && (
                  <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400 animate-pulse">
                    HUMAN TARGET IN FRAME
                  </span>
                )}
                <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                  {videoFrame ? "STREAM LIVE" : "STANDBY"}
                </span>
              </div>
            </div>

            <div
              className={`relative aspect-video w-full overflow-hidden rounded-xl border ${
                isPersonDetected ? "border-red-500/80" : "border-slate-800"
              } bg-slate-950 flex items-center justify-center`}
            >
              {videoFrame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/jpeg;base64,${videoFrame}`}
                  alt="Netra Camera"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <VideoOff size={32} />
                  <p className="font-mono text-xs">Awaiting video frames from Netra camera</p>
                  <span className="text-[10px] text-slate-500">
                    Standby mode active when Netra is disconnected
                  </span>
                </div>
              )}

              {/* Tactical Person Detection HUD Overlay */}
              {isPersonDetected && (
                <div className="absolute top-3 left-3 rounded-lg border border-red-500 bg-red-600/90 px-3 py-1.5 text-xs font-mono font-bold text-white flex items-center gap-2 shadow-lg shadow-red-600/50 animate-pulse">
                  <UserCheck size={16} />
                  <span>
                    PERSON DETECTED ({personCount} {personCount === 1 ? "SUBJECT" : "SUBJECTS"})
                  </span>
                </div>
              )}

              {/* Tactical corner brackets if target detected */}
              {isPersonDetected && (
                <div className="absolute inset-2 pointer-events-none border border-red-500/40 rounded-lg">
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>RESOLUTION: 640×480 @ ~2 FPS Relay</span>
              <span>CODEC: JPEG / WS</span>
            </div>
          </div>

          {/* Netra GPS & Sensor Metrics */}
          <div className="space-y-4">
            {/* GPS Position Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">
                    High-Precision GPS Fix
                  </h3>
                </div>
                <span
                  className={`font-mono text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                    hasGps
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {hasGps ? "SATELLITE LOCKED" : "SEARCHING"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3 text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Latitude</span>
                  <p className="mt-1 text-xl font-black text-white">
                    {hasGps ? `${latNum.toFixed(6)}°` : "--"}
                  </p>
                  <span className="text-[10px] text-cyan-400 block mt-0.5">
                    {hasGps ? (latNum >= 0 ? "NORTH" : "SOUTH") : ""}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3 text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Longitude</span>
                  <p className="mt-1 text-xl font-black text-white">
                    {hasGps ? `${lngNum.toFixed(6)}°` : "--"}
                  </p>
                  <span className="text-[10px] text-cyan-400 block mt-0.5">
                    {hasGps ? (lngNum >= 0 ? "EAST" : "WEST") : ""}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-lg bg-[#070D1C] p-2 text-center">
                  <span className="text-[9px] text-slate-500 block">ACCURACY</span>
                  <span className="font-bold text-slate-200">
                    {phoneTelemetry.accuracy ? `±${phoneTelemetry.accuracy}m` : "--"}
                  </span>
                </div>
                <div className="rounded-lg bg-[#070D1C] p-2 text-center">
                  <span className="text-[9px] text-slate-500 block">ALTITUDE</span>
                  <span className="font-bold text-slate-200">
                    {phoneTelemetry.altitude ? `${phoneTelemetry.altitude}m` : "--"}
                  </span>
                </div>
                <div className="rounded-lg bg-[#070D1C] p-2 text-center">
                  <span className="text-[9px] text-slate-500 block">SPEED</span>
                  <span className="font-bold text-slate-200">
                    {phoneTelemetry.speed ? `${phoneTelemetry.speed} m/s` : "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Telemetry Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">
                    Device Vital Telemetry
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  ANDROID OS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Battery size={15} className="text-cyan-400" />
                    <span className="text-slate-400">BATTERY:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.batteryLevel !== undefined && phoneTelemetry.batteryLevel !== null
                      ? `${phoneTelemetry.batteryLevel}%`
                      : "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Wifi size={15} className="text-cyan-400" />
                    <span className="text-slate-400">NETWORK:</span>
                  </div>
                  <span className="font-bold text-white">
                    {(phoneTelemetry.networkType as string) || "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Compass size={15} className="text-cyan-400" />
                    <span className="text-slate-400">HEADING:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.heading ? `${phoneTelemetry.heading}` : "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Radio size={15} className="text-cyan-400" />
                    <span className="text-slate-400">ORIENTATION:</span>
                  </div>
                  <span className="font-bold text-white truncate max-w-[110px]" title={String(phoneTelemetry.deviceOrientation || "")}>
                    {phoneTelemetry.deviceOrientation ? `${phoneTelemetry.deviceOrientation}` : "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Camera size={15} className="text-cyan-400" />
                    <span className="text-slate-400">CAMERA:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.cameraAvailable !== undefined && phoneTelemetry.cameraAvailable !== null
                      ? phoneTelemetry.cameraAvailable
                        ? "Available"
                        : "Offline"
                      : "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Mic size={15} className="text-cyan-400" />
                    <span className="text-slate-400">MICROPHONE:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.microphoneAvailable !== undefined && phoneTelemetry.microphoneAvailable !== null
                      ? phoneTelemetry.microphoneAvailable
                        ? "Ready"
                        : "Offline"
                      : "--"}
                  </span>
                </div>
              </div>

              {/* Pitch & Roll Readings if provided */}
              {(phoneTelemetry.pitch || phoneTelemetry.roll) && (
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded-lg bg-[#070D1C] p-2 text-center">
                    <span className="text-[9px] text-slate-500 block">PHONE PITCH</span>
                    <span className="font-bold text-slate-200">
                      {String(phoneTelemetry.pitch)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#070D1C] p-2 text-center">
                    <span className="text-[9px] text-slate-500 block">PHONE ROLL</span>
                    <span className="font-bold text-slate-200">
                      {String(phoneTelemetry.roll)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
