"use client";

import { useState } from "react";

type MissionState = "standby" | "active" | "paused" | "completed";

export default function MissionStatus() {
  const [missionState, setMissionState] =
    useState<MissionState>("standby");

  const progress = missionState === "standby" ? 0 : 35;

  const getStatusText = () => {
    switch (missionState) {
      case "active":
        return "ACTIVE";
      case "paused":
        return "PAUSED";
      case "completed":
        return "COMPLETED";
      default:
        return "STANDBY";
    }
  };

  const getStatusClass = () => {
    switch (missionState) {
      case "active":
        return "text-green-400";
      case "paused":
        return "text-yellow-400";
      case "completed":
        return "text-cyan-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">
            Mission Status
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Current search operation
          </p>
        </div>

        <span
          className={`text-xs font-semibold ${getStatusClass()}`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Mission information */}
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mission
          </span>

          <span className="text-sm font-medium text-white">
            Search Zone A
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mission ID
          </span>

          <span className="font-mono text-sm text-slate-300">
            SARAS-M001
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Objective
          </span>

          <span className="text-sm text-slate-300">
            Area Search
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Assigned Rover
          </span>

          <span className="text-sm text-cyan-400">
            SARAS-01
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Mission Progress
            </span>

            <span className="text-xs font-semibold text-cyan-400">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Elapsed time */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Elapsed Time
          </span>

          <span className="font-mono text-sm text-slate-300">
            00:00:00
          </span>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMissionState("active")}
            className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
          >
            Start
          </button>

          <button
            type="button"
            onClick={() => setMissionState("paused")}
            className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs font-medium text-yellow-400 transition hover:bg-yellow-500/20"
          >
            Pause
          </button>

          <button
            type="button"
            onClick={() => setMissionState("completed")}
            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
          >
            End
          </button>
        </div>
      </div>
    </section>
  );
}