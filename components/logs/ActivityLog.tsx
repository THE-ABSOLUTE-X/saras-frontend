"use client";

import { useState } from "react";

type LogType = "info" | "success" | "warning" | "error";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: LogType;
}

const initialLogs: LogEntry[] = [
  {
    id: 1,
    time: "14:32:10",
    message: "Rover started",
    type: "success",
  },
  {
    id: 2,
    time: "14:31:45",
    message: "GPS signal acquired",
    type: "success",
  },
  {
    id: 3,
    time: "14:30:22",
    message: "Mission initialized",
    type: "info",
  },
  {
    id: 4,
    time: "14:29:58",
    message: "SARAS-01 connected",
    type: "success",
  },
];

export default function ActivityLog() {
  const [logs] = useState<LogEntry[]>(initialLogs);

  const getTypeClass = (type: LogType) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">
            Activity Log
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Recent system and rover activity
          </p>
        </div>

        <span className="text-xs text-green-400">
          LIVE
        </span>
      </div>

      {/* Log entries */}
      <div className="max-h-64 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-4 border-b border-slate-800/70 px-5 py-3 last:border-b-0"
          >
            {/* Time */}
            <span className="w-20 shrink-0 font-mono text-xs text-slate-500">
              {log.time}
            </span>

            {/* Status indicator */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${getTypeClass(
                log.type
              ).replace("text-", "bg-")}`}
            />

            {/* Message */}
            <span className="text-sm text-slate-300">
              {log.message}
            </span>

            {/* Type */}
            <span
              className={`ml-auto text-[10px] font-semibold uppercase ${getTypeClass(
                log.type
              )}`}
            >
              {log.type}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}   