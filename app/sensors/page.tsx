"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RoverViewer from "@/components/3d/RoverViewer";
import { useRobotStore } from "@/stores/useRobotStore";
import {
  Thermometer,
  Droplets,
  Flame,
  Wind,
  Compass,
  Battery,
  Cpu,
  Layers,
} from "lucide-react";

export default function SensorsPage() {
  const { telemetry } = useRobotStore();
  const [viewMode, setViewMode] = useState<"regular" | "advanced">("regular");

  // Temperature status
  const tempStatus =
    telemetry.temperature === null
      ? "unknown"
      : telemetry.temperature > 50
        ? "danger"
        : telemetry.temperature > 38
          ? "warning"
          : "normal";

  // Gas status
  const gasStatus =
    telemetry.gasLevel === null
      ? "unknown"
      : telemetry.gasLevel > 400
        ? "danger"
        : telemetry.gasLevel > 250
          ? "warning"
          : "normal";


  // Distance status
  const distStatus =
    telemetry.ultrasonicDistance === null
      ? "unknown"
      : telemetry.ultrasonicDistance < 20
        ? "danger"
        : telemetry.ultrasonicDistance < 40
          ? "warning"
          : "normal";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                SARAS Operational Mode
              </span>
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
                SENSOR TELEMETRY
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Environmental & Inertial Telemetry
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Live DHT, MQ-7, HC-SR04, and MPU6050 6-DOF inertial sensor telemetry.
            </p>
          </div>

          {/* Regular vs Advanced View Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0B1222] p-1">
            <button
              type="button"
              onClick={() => setViewMode("regular")}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                viewMode === "regular"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Regular View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("advanced")}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                viewMode === "advanced"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Advanced Engineering View
            </button>
          </div>
        </div>

        {/* Regular View */}
        {viewMode === "regular" ? (
          <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Temperature */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    Ambient Temp
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                    <Thermometer size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-mono text-3xl font-black text-white">
                    {telemetry.temperature !== null
                      ? `${telemetry.temperature.toFixed(1)}°C`
                      : "--"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">DHT SENSOR</span>
                  <span
                    className={`font-bold uppercase ${
                      tempStatus === "danger"
                        ? "text-red-400"
                        : tempStatus === "warning"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {tempStatus}
                  </span>
                </div>
              </div>

              {/* Humidity */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    Rel. Humidity
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Droplets size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-mono text-3xl font-black text-white">
                    {telemetry.humidity !== null
                      ? `${telemetry.humidity.toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">HUMIDITY</span>
                  <span className="text-green-400 font-bold uppercase">
                    Optimal
                  </span>
                </div>
              </div>

              {/* Gas (MQ-7) */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    CO Gas (MQ-7)
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Wind size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-mono text-3xl font-black text-white">
                    {telemetry.gasLevel !== null ? telemetry.gasLevel : "--"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">ANALOG RAW</span>
                  <span
                    className={`font-bold uppercase ${
                      gasStatus === "danger"
                        ? "text-red-400"
                        : gasStatus === "warning"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {gasStatus}
                  </span>
                </div>
              </div>

              {/* Flame Detector */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase">
                    Flame Sensor
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      telemetry.flameDetected
                        ? "bg-red-500/20 text-red-400 animate-pulse"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Flame size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span
                    className={`font-mono text-2xl font-black ${
                      telemetry.flameDetected ? "text-red-400" : "text-white"
                    }`}
                  >
                    {telemetry.flameDetected === null
                      ? "--"
                      : telemetry.flameDetected
                        ? "FIRE DETECTED"
                        : "NORMAL / CLEAR"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">OPTICAL IR</span>
                  <span
                    className={`font-bold uppercase ${
                      telemetry.flameDetected ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {telemetry.flameDetected ? "DANGER" : "SAFE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: 3D Attitude & MPU6050 Orientation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-cyan-400" />
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      MPU6050 3D Rover Attitude
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    REAL-TIME MODEL
                  </span>
                </div>
                <RoverViewer
                  roll={telemetry.roll}
                  pitch={telemetry.pitch}
                  className="h-[300px] w-full"
                />
              </div>

              {/* MPU6050 Euler & Ultrasonic Front Distance */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      Inertial Euler Angles
                    </h3>
                    <span className="font-mono text-[10px] text-cyan-400">
                      FILTERED FUSION
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-4 text-center">
                      <span className="font-mono text-xs text-slate-500 uppercase">
                        Roll Angle
                      </span>
                      <p className="mt-1 font-mono text-3xl font-black text-cyan-400">
                        {telemetry.roll !== null && telemetry.roll !== undefined
                          ? `${telemetry.roll.toFixed(1)}°`
                          : "--"}
                      </p>
                      <span className="mt-1 text-[10px] font-mono text-slate-500 block">
                        LATERAL TILT
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-4 text-center">
                      <span className="font-mono text-xs text-slate-500 uppercase">
                        Pitch Angle
                      </span>
                      <p className="mt-1 font-mono text-3xl font-black text-cyan-400">
                        {telemetry.pitch !== null && telemetry.pitch !== undefined
                          ? `${telemetry.pitch.toFixed(1)}°`
                          : "--"}
                      </p>
                      <span className="mt-1 text-[10px] font-mono text-slate-500 block">
                        LONGITUDINAL TILT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      Front Ultrasonic Range
                    </h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      HC-SR04
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-mono text-4xl font-black text-white">
                        {telemetry.ultrasonicDistance !== null
                          ? `${telemetry.ultrasonicDistance.toFixed(1)} cm`
                          : "--"}
                      </span>
                      <p className="font-mono text-[11px] text-slate-400 mt-1">
                        Obstacle clearance in front travel path
                      </p>
                    </div>

                    <span
                      className={`font-mono text-xs font-bold uppercase rounded-lg px-2.5 py-1 ${
                        distStatus === "danger"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : distStatus === "warning"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {distStatus === "danger"
                        ? "OBSTACLE CLOSE"
                        : distStatus === "warning"
                          ? "CAUTION"
                          : "CLEAR PATH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Advanced Engineering View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* MPU6050 Accelerometer Raw Registers */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-cyan-400" />
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      MPU Accelerometer (g)
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">±2g RANGE</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">ACCEL X:</span>
                    <span className="font-bold text-white">
                      {telemetry.accelerometerX?.toFixed(3) ?? "--"} g
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">ACCEL Y:</span>
                    <span className="font-bold text-white">
                      {telemetry.accelerometerY?.toFixed(3) ?? "--"} g
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">ACCEL Z:</span>
                    <span className="font-bold text-white">
                      {telemetry.accelerometerZ?.toFixed(3) ?? "--"} g
                    </span>
                  </div>
                </div>
              </div>

              {/* MPU6050 Gyroscope Raw Registers */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-cyan-400" />
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      MPU Gyroscope (°/s)
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">±250 dps</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">GYRO X:</span>
                    <span className="font-bold text-white">
                      {telemetry.gyroscopeX?.toFixed(2) ?? "--"} °/s
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">GYRO Y:</span>
                    <span className="font-bold text-white">
                      {telemetry.gyroscopeY?.toFixed(2) ?? "--"} °/s
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">GYRO Z:</span>
                    <span className="font-bold text-white">
                      {telemetry.gyroscopeZ?.toFixed(2) ?? "--"} °/s
                    </span>
                  </div>
                </div>
              </div>

              {/* Battery & Power Registers */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Battery size={16} className="text-cyan-400" />
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      Power Rail & Bus
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">ADC VOLTAGE</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">VOLTAGE:</span>
                    <span className="font-bold text-white">
                      {telemetry.batteryVoltage?.toFixed(2) ?? "--"} V
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">CHARGE:</span>
                    <span className="font-bold text-white">
                      {telemetry.batteryLevel?.toFixed(0) ?? "--"} %
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[#070D1C] p-2.5">
                    <span className="text-slate-400">STATUS:</span>
                    <span className="font-bold text-cyan-400">
                      {telemetry.batteryStatus ?? "NORMAL"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firmware Sequence & System Safety Table */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase">
                    Firmware Safety Interlocks & Packet Diagnostics
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  ESP8266 PRIMARY + SECONDARY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                  <span className="text-[10px] text-slate-500 uppercase block">Sequence ID</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    #{telemetry.sequence ?? 0}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                  <span className="text-[10px] text-slate-500 uppercase block">Motion State</span>
                  <span className="text-base font-bold text-cyan-400 mt-1 block">
                    {telemetry.motionState ?? "IDLE"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                  <span className="text-[10px] text-slate-500 uppercase block">Safety Interlock</span>
                  <span className="text-base font-bold text-green-400 mt-1 block">
                    {telemetry.safetyState ?? "CLEAR"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-3">
                  <span className="text-[10px] text-slate-500 uppercase block">MPU Die Temp</span>
                  <span className="text-base font-bold text-amber-400 mt-1 block">
                    {telemetry.mpuTemperature?.toFixed(1) ?? "--"} °C
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
