"use client";

import { useState } from "react";
import type { TelemetryData, PhoneTelemetryData } from "@/types/telemetry";

type AlertType = "danger" | "warning" | "normal";

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
}

export interface AlertsPanelProps {
  telemetry?: TelemetryData | null;
  phoneTelemetry?: PhoneTelemetryData | null;
  wsConnected?: boolean;
}

export default function AlertsPanel({
  telemetry,
  phoneTelemetry,
  wsConnected = true,
}: AlertsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Construct active alerts dynamically from live telemetry
  const activeAlerts: AlertItem[] = [];

  if (phoneTelemetry?.personDetected === true) {
    activeAlerts.push({
      id: "netra-person-detected",
      type: "danger",
      title: "Human Presence Detected",
      message: `Netra reconnaissance node identified ${
        phoneTelemetry.personCount !== null && phoneTelemetry.personCount !== undefined
          ? phoneTelemetry.personCount
          : 1
      } person(s).`,
      time: phoneTelemetry.timestamp
        ? new Date(phoneTelemetry.timestamp).toLocaleTimeString()
        : "Live",
    });
  }

  if (telemetry?.flameDetected === true) {
    activeAlerts.push({
      id: "flame-detected",
      type: "danger",
      title: "Flame / Fire Detected",
      message: "Optical flame sensor triggered emergency condition.",
      time: "Live",
    });
  }

  if (wsConnected === false) {
    activeAlerts.push({
      id: "ws-disconnected",
      type: "warning",
      title: "Control Station Offline",
      message: "WebSocket connection to SARAS backend is currently disconnected.",
      time: "Live",
    });
  } else if (telemetry && telemetry.robotConnected === false) {
    activeAlerts.push({
      id: "robot-disconnected",
      type: "warning",
      title: "SARAS-01 Disconnected",
      message: "Rover telemetry reports robot is currently offline.",
      time: "Live",
    });
  }

  if (telemetry?.robotStatus === "warning") {
    activeAlerts.push({
      id: "robot-status-warning",
      type: "warning",
      title: "Rover Status: Warning",
      message: "Rover reported warning operating state.",
      time: "Live",
    });
  } else if (telemetry?.robotStatus === "offline") {
    activeAlerts.push({
      id: "robot-status-offline",
      type: "danger",
      title: "Rover Status: Offline",
      message: "Rover operating state transitioned to offline.",
      time: "Live",
    });
  }

  // Filter out any dismissed alerts
  const visibleAlerts = activeAlerts.filter(
    (alert) => !dismissedIds.includes(alert.id)
  );

  const clearAlerts = () => {
    setDismissedIds(activeAlerts.map((a) => a.id));
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
      container: "border-slate-800 bg-slate-950/40",
      icon: "bg-cyan-400",
      title: "text-slate-300",
      message: "text-slate-400",
    };
  };

  const hasDanger = visibleAlerts.some((a) => a.type === "danger");
  const hasWarning = visibleAlerts.some((a) => a.type === "warning");

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
              hasDanger
                ? "bg-red-500 animate-pulse"
                : hasWarning
                  ? "bg-yellow-400"
                  : "bg-cyan-400"
            }`}
          />

          <span
            className={
              hasDanger
                ? "text-red-400 font-semibold"
                : hasWarning
                  ? "text-yellow-400 font-semibold"
                  : "text-cyan-400"
            }
          >
            {hasDanger
              ? "Emergency"
              : hasWarning
                ? "Warning"
                : "Monitoring Active"}
          </span>
        </div>
      </div>

      {/* Alerts Content */}
      <div className="space-y-3 p-5">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  System Monitoring
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Monitoring active — no alert data available
                </p>
              </div>
            </div>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const style = getAlertStyle(alert.type);

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 ${style.container}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.icon}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${style.title}`}>
                        {alert.title}
                      </p>

                      <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                        {alert.time}
                      </span>
                    </div>

                    <p className={`mt-1 text-xs ${style.message}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {visibleAlerts.length > 0 && (
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