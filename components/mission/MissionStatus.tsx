"use client";

import { useState } from "react";
import type { SearchAreaInfo } from "@/components/map/Sarasmap";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
} from "lucide-react";

export type MissionSubmissionStatus =
  | "NOT_SELECTED"
  | "SELECTED"
  | "VERIFYING"
  | "VERIFIED"
  | "REJECTED"
  | "ERROR";

export interface MissionStatusProps {
  searchArea?: SearchAreaInfo | null;
  submissionStatus?: MissionSubmissionStatus;
  missionId?: string | null;
  statusMessage?: string | null;
  onSubmitArea?: () => void;
}

type MissionState = "standby" | "active" | "paused" | "completed";

export default function MissionStatus({
  searchArea = null,
  submissionStatus = "NOT_SELECTED",
  missionId = null,
  statusMessage = null,
  onSubmitArea,
}: MissionStatusProps = {}) {
  const [missionState, setMissionState] = useState<MissionState>("standby");

  const progress =
    submissionStatus === "VERIFIED"
      ? 15
      : missionState === "standby"
        ? 0
        : 35;

  const getStatusBadge = () => {
    switch (submissionStatus) {
      case "SELECTED":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AREA SELECTED
          </span>
        );
      case "VERIFYING":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-400">
            <Loader2 size={11} className="animate-spin text-yellow-400" />
            VERIFYING
          </span>
        );
      case "VERIFIED":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
            <CheckCircle2 size={11} className="text-green-400" />
            SEARCH AREA VERIFIED
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
            <AlertTriangle size={11} className="text-red-400" />
            SEARCH AREA REJECTED
          </span>
        );
      case "ERROR":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
            <WifiOff size={11} className="text-red-400" />
            VERIFICATION ERROR
          </span>
        );
      case "NOT_SELECTED":
      default:
        switch (missionState) {
          case "active":
            return (
              <span className="text-xs font-semibold text-green-400">
                ACTIVE
              </span>
            );
          case "paused":
            return (
              <span className="text-xs font-semibold text-yellow-400">
                PAUSED
              </span>
            );
          case "completed":
            return (
              <span className="text-xs font-semibold text-cyan-400">
                COMPLETED
              </span>
            );
          default:
            return (
              <span className="text-xs font-semibold text-slate-400">
                NOT SELECTED
              </span>
            );
        }
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">Mission Status</h3>
          <p className="mt-1 text-xs text-slate-500">Current search operation</p>
        </div>

        {getStatusBadge()}
      </div>

      {/* Mission information */}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Mission Target</span>

          <span className="text-sm font-medium text-white">
            {searchArea
              ? `Selected Rect (${Math.round(searchArea.widthMeters)}m × ${Math.round(searchArea.heightMeters)}m)`
              : "Search Zone A"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Mission ID</span>

          <span className="font-mono text-xs text-slate-300">
            {missionId || "SARAS-M001"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Objective</span>

          <span className="text-sm text-slate-300">Area Search</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Assigned Rover</span>

          <span className="text-sm text-cyan-400">SARAS-01</span>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Mission Progress</span>

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
          <span className="text-xs text-slate-500">Elapsed Time</span>

          <span className="font-mono text-sm text-slate-300">00:00:00</span>
        </div>

        {/* Backend Mission Submission Action */}
        <div className="border-t border-slate-800/80 pt-3">
          {submissionStatus === "SELECTED" && (
            <button
              type="button"
              onClick={onSubmitArea}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 active:scale-[0.99]"
            >
              <Send size={14} />
              Submit & Verify Search Area
            </button>
          )}

          {submissionStatus === "VERIFYING" && (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/70 py-2.5 text-xs font-semibold text-cyan-300 cursor-not-allowed opacity-90"
            >
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              Verifying search area with backend...
            </button>
          )}

          {submissionStatus === "VERIFIED" && (
            <div className="space-y-2">
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-xs font-semibold text-green-400">
                <CheckCircle2 size={15} />
                SEARCH AREA VERIFIED
              </div>
              <p className="text-[11px] text-center text-slate-400">
                Backend mission validation accepted the submitted search area.
              </p>
            </div>
          )}

          {submissionStatus === "REJECTED" && (
            <div className="space-y-2">
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400">
                <AlertTriangle size={15} />
                SEARCH AREA REJECTED
              </div>
              <button
                type="button"
                onClick={onSubmitArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 active:scale-[0.99]"
              >
                <AlertTriangle size={14} />
                Retry Search Area Submission
              </button>
            </div>
          )}

          {submissionStatus === "ERROR" && (
            <div className="space-y-2">
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400">
                <WifiOff size={15} />
                VERIFICATION ERROR
              </div>
              <button
                type="button"
                onClick={onSubmitArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 py-2.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/20 active:scale-[0.99]"
              >
                <WifiOff size={14} />
                Retry Backend Request
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="mt-2.5 rounded-lg border border-slate-800 bg-[#060B18] p-2.5 text-[11px] font-mono leading-relaxed text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                Backend Verification Status:
              </span>
              <p className="break-all">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Existing Mission Controls */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
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