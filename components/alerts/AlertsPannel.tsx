"use client";

import { useState } from "react";

type AlertType = "danger" | "warning" | "normal";

interface AlertItem {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  time: string;
}

const initialAlerts: AlertItem[] = [
  {
    id: 1,
    type: "normal",
    title: "System Normal",
    message: "No active emergency detected",
    time: "Now",
  },
];

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  const clearAlerts = () => {
    setAlerts([]);
  };

  const getAlertStyle = (type: AlertType) => {
    if (type === "danger") {
      return {
        container: "border-red-900/60 bg-red-950/30",
        icon: "bg-red-500",
        title: "text-red-400",
        message: "text-red-300/80",
      };
    }

    if (type === "warning") {
      return {
        container: "border-yellow-900/60 bg-yellow-950/30",
        icon: "bg-yellow-400",
        title: "text-yellow-400",
        message: "text-yellow-300/80",
      };
    }

    return {
      container: "border-green-900/60 bg-green-950/20",
      icon: "bg-green-400",
      title: "text-green-400",
      message: "text-green-300/80",
    };
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">
            Alerts & Emergency Status
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Real-time safety notifications
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              alerts.some((alert) => alert.type === "danger")
                ? "bg-red-500"
                : alerts.some((alert) => alert.type === "warning")
                  ? "bg-yellow-400"
                  : "bg-green-400"
            }`}
          />

          <span
            className={
              alerts.some((alert) => alert.type === "danger")
                ? "text-red-400"
                : alerts.some((alert) => alert.type === "warning")
                  ? "text-yellow-400"
                  : "text-green-400"
            }
          >
            {alerts.some((alert) => alert.type === "danger")
              ? "Emergency"
              : alerts.some((alert) => alert.type === "warning")
                ? "Warning"
                : "All Clear"}
          </span>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3 p-5">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <span className="text-lg text-green-400">✓</span>
            </div>

            <p className="text-sm font-medium text-green-400">
              No Active Alerts
            </p>

            <p className="mt-1 text-xs text-slate-500">
              SARAS systems are operating normally.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getAlertStyle(alert.type);

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 ${style.container}`}
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.icon}`}
                  />

                  {/* Alert content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`text-sm font-semibold ${style.title}`}
                      >
                        {alert.title}
                      </p>

                      <span className="shrink-0 text-[10px] text-slate-500">
                        {alert.time}
                      </span>
                    </div>

                    <p
                      className={`mt-1 text-xs ${style.message}`}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Clear button */}
        {alerts.length > 0 && (
          <button
            type="button"
            onClick={clearAlerts}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-white"
          >
            Clear Alerts
          </button>
        )}
      </div>
    </section>
  );
}