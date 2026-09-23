"use client";

export type LogType = "info" | "success" | "warning" | "error";

export interface LogEntry {
  id: string | number;
  time: string;
  message: string;
  type: LogType;
}

const fallbackLogs: LogEntry[] = [
  {
    id: "f-1",
    time: "--:--:--",
    message: "System initialized. Waiting for rover session events...",
    type: "info",
  },
];

export interface ActivityLogProps {
  logs?: LogEntry[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  const displayLogs = logs && logs.length > 0 ? logs : fallbackLogs;
  const isLive = Boolean(logs && logs.length > 0);

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
          <h3 className="font-semibold text-white">Activity Log</h3>
          <p className="mt-1 text-xs text-slate-500">
            Real-time system and mission activity events
          </p>
        </div>

        <span
          className={`text-xs font-semibold ${
            isLive ? "text-green-400" : "text-slate-500"
          }`}
        >
          {isLive ? "LIVE SESSION" : "STANDBY"}
        </span>
      </div>

      {/* Log entries */}
      <div className="max-h-64 overflow-y-auto">
        {displayLogs.map((log) => (
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
            <span className="text-sm text-slate-300">{log.message}</span>

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