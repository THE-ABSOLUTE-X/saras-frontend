"use client";

import AppShell from "@/components/layout/AppShell";
import { useRobotStore } from "@/stores/useRobotStore";
import {
  Smartphone,
  MapPin,
  Video,
  VideoOff,
  UserCheck,
  Battery,
  Wifi,
  Radio,
  Volume2,
  Shield,
} from "lucide-react";

export default function PhonePage() {
  const {
    phoneTelemetry,
    videoFrame,
    operatorContact,
    setOperatorContact,
    addLog,
  } = useRobotStore();

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
              Independent Android payload providing tactical WGS84 GPS, high-resolution vision, and emergency operator intercom.
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

        {/* Subsystem Architecture Clarification Card */}
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

        {/* Main Grid: Video Stream & GPS / Health Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Netra Camera Feed */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Netra Optical Payload
                </h3>
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
                  alt="Netra Camera"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <VideoOff size={32} />
                  <p className="font-mono text-xs">Awaiting video frames from Netra camera</p>
                </div>
              )}

              {/* Person Detection HUD Tag */}
              {phoneTelemetry.personDetected && (
                <div className="absolute top-3 left-3 rounded-lg border border-red-500/40 bg-red-600/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-red-600/40 animate-pulse">
                  <UserCheck size={14} />
                  <span>PERSON DETECTED ({(Number(phoneTelemetry.confidence || 0.95) * 100).toFixed(0)}%)</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>RESOLUTION: 1080p Tactical Stream</span>
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
                    {hasGps ? latNum.toFixed(6) : "--"}°
                  </p>
                  <span className="text-[10px] text-cyan-400 block mt-0.5">
                    {hasGps ? (latNum >= 0 ? "NORTH" : "SOUTH") : ""}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3 text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Longitude</span>
                  <p className="mt-1 text-xl font-black text-white">
                    {hasGps ? lngNum.toFixed(6) : "--"}°
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
                    {phoneTelemetry.accuracy ? `±${phoneTelemetry.accuracy}m` : "±1.5m"}
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
                    {phoneTelemetry.speed ? `${phoneTelemetry.speed} m/s` : "0.0 m/s"}
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

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Battery size={16} className="text-cyan-400" />
                    <span className="text-slate-400">BATTERY:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.batteryLevel !== undefined
                      ? `${phoneTelemetry.batteryLevel}%`
                      : "92%"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className="text-cyan-400" />
                    <span className="text-slate-400">NETWORK LINK:</span>
                  </div>
                  <span className="font-bold text-white">
                    {(phoneTelemetry.networkType as string) || "5G NR / LOW LATENCY"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#070D1C] p-3">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-cyan-400" />
                    <span className="text-slate-400">HEADING:</span>
                  </div>
                  <span className="font-bold text-white">
                    {phoneTelemetry.heading ? `${phoneTelemetry.heading}°` : "N 024°"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
