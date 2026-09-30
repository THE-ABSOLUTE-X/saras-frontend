"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import SarasMap, { type SearchAreaInfo } from "@/components/map/Sarasmap";
import MissionStatus from "@/components/mission/MissionStatus";
import { useRobotStore } from "@/stores/useRobotStore";
import { apiService } from "@/services/apiService";
import {
  Compass,
  Layers,
  RefreshCw,
  Navigation,
} from "lucide-react";

export default function MissionPage() {
  const {
    telemetry,
    phoneTelemetry,
    searchArea,
    setSearchArea,
    missionStatus,
    missionId,
    missionMessage,
    setMissionStatus,
    addLog,
  } = useRobotStore();

  const [searchPattern, setSearchPattern] = useState<
    "lawnmower" | "spiral" | "transects"
  >("lawnmower");
  const [transectSpacing, setTransectSpacing] = useState<number>(3); // 3m spacing
  const [searchSpeed, setSearchSpeed] = useState<number>(65); // 65%

  // Resolve effective GPS coordinates
  const effectiveLat =
    phoneTelemetry.latitude !== undefined && phoneTelemetry.latitude !== null
      ? (phoneTelemetry.latitude as number)
      : telemetry.latitude;
  const effectiveLng =
    phoneTelemetry.longitude !== undefined && phoneTelemetry.longitude !== null
      ? (phoneTelemetry.longitude as number)
      : telemetry.longitude;

  const handleSearchAreaSelect = (area: SearchAreaInfo | null) => {
    setSearchArea(area);
    if (area) {
      addLog(
        `Search rectangle selected: ${Math.round(area.widthMeters)}m × ${Math.round(
          area.heightMeters
        )}m (${Math.round(area.areaSquareMeters)} m²)`,
        "info"
      );
    } else {
      addLog("Search area cleared", "info");
    }
  };

  const handleSubmitSearchArea = async () => {
    if (!searchArea) return;

    setMissionStatus(
      "VERIFYING",
      "Submitting search area to POST /api/v1/missions for validation..."
    );
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

      const createdMission = result.mission;
      const createdId = createdMission?.missionId || "SARAS-M001";

      setMissionStatus(
        "VERIFIED",
        `Search area accepted and verified! Mission ID: ${createdId}`,
        createdId
      );
      addLog(`Search area verified successfully (Mission: ${createdId})`, "success");
    } catch (err) {
      setMissionStatus(
        "ERROR",
        `Backend request failed: ${err instanceof Error ? err.message : String(err)}`
      );
      addLog("Mission validation network error", "error");
    }
  };

  // Generate simulated waypoints from boundary if area exists
  const waypoints = searchArea
    ? [
        {
          id: "WP-01",
          label: "Start Entry (SW)",
          lat: searchArea.south,
          lng: searchArea.west,
        },
        {
          id: "WP-02",
          label: "Transect 1 (SE)",
          lat: searchArea.south,
          lng: searchArea.east,
        },
        {
          id: "WP-03",
          label: "Turn 1 (NE)",
          lat: searchArea.north,
          lng: searchArea.east,
        },
        {
          id: "WP-04",
          label: "Exit / Home (NW)",
          lat: searchArea.north,
          lng: searchArea.west,
        },
      ]
    : [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                SARAS Operational Mode
              </span>
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
                MISSION PLANNING
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Search Area Definition & Path Planning
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Draw search boundary on map, verify with backend mission validator, and configure coverage patterns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSearchAreaSelect(null)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0B1222] px-3.5 py-2 font-mono text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              <RefreshCw size={13} />
              Clear Area
            </button>
          </div>
        </div>

        {/* Main Grid: Interactive Map (Left) & Mission Control (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1222] shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Tactical MapLibre GIS
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>TERRADRAW RECTANGLE TOOL ACTIVE</span>
                </div>
              </div>

              <div className="relative h-[540px] w-full bg-slate-950">
                <SarasMap
                  latitude={effectiveLat}
                  longitude={effectiveLng}
                  onSearchAreaSelect={handleSearchAreaSelect}
                />
              </div>
            </div>

            {/* Boundary Geometry Inspector */}
            {searchArea && (
              <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                  <Layers size={14} />
                  Selected Boundary Coordinates (WGS84)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase block">South-West (P1)</span>
                    <p className="text-slate-200 mt-1">{searchArea.south.toFixed(6)}° N</p>
                    <p className="text-slate-400">{searchArea.west.toFixed(6)}° E</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase block">South-East (P2)</span>
                    <p className="text-slate-200 mt-1">{searchArea.south.toFixed(6)}° N</p>
                    <p className="text-slate-400">{searchArea.east.toFixed(6)}° E</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase block">North-East (P3)</span>
                    <p className="text-slate-200 mt-1">{searchArea.north.toFixed(6)}° N</p>
                    <p className="text-slate-400">{searchArea.east.toFixed(6)}° E</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-[#070D1C] p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase block">North-West (P4)</span>
                    <p className="text-slate-200 mt-1">{searchArea.north.toFixed(6)}° N</p>
                    <p className="text-slate-400">{searchArea.west.toFixed(6)}° E</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Mission Status & Search Parameters */}
          <div className="space-y-6">
            {/* Mission Submission & Status Card */}
            <MissionStatus
              searchArea={searchArea}
              submissionStatus={missionStatus}
              missionId={missionId}
              statusMessage={missionMessage}
              onSubmitArea={handleSubmitSearchArea}
            />

            {/* Pattern & Coverage Settings */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h3 className="font-semibold text-white">Coverage Pattern</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Select path algorithm for autonomous traversal
                </p>
              </div>

              {/* Pattern Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "lawnmower", label: "Lawnmower", desc: "Boustrophedon" },
                  { id: "spiral", label: "Inward Spiral", desc: "Perimeter First" },
                  { id: "transects", label: "Transects", desc: "Linear Grid" },
                ].map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() =>
                      setSearchPattern(
                        pattern.id as "lawnmower" | "spiral" | "transects"
                      )
                    }
                    className={`rounded-xl border p-2.5 text-left transition ${
                      searchPattern === pattern.id
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{pattern.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{pattern.desc}</div>
                  </button>
                ))}
              </div>

              {/* Spacing & Speed */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">TRANSECT SPACING:</span>
                    <span className="text-cyan-400 font-bold">{transectSpacing} METERS</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={transectSpacing}
                    onChange={(e) => setTransectSpacing(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">TARGET SEARCH SPEED:</span>
                    <span className="text-cyan-400 font-bold">{searchSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={searchSpeed}
                    onChange={(e) => setSearchSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Waypoints Preview */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-cyan-400" />
                  <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                    Waypoints Preview
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {waypoints.length} WAYPOINTS
                </span>
              </div>

              {waypoints.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  Select search area on map to generate waypoint sequence
                </div>
              ) : (
                <div className="space-y-2">
                  {waypoints.map((wp) => (
                    <div
                      key={wp.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#070D1C] px-3 py-2 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        <span className="text-white font-bold">{wp.id}</span>
                        <span className="text-slate-400 text-[11px]">{wp.label}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
