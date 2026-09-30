"use client";

import { useEffect, useRef } from "react";
import { useRobotStore } from "@/stores/useRobotStore";
import { apiService } from "@/services/apiService";
import type { TelemetryData, PhoneTelemetryData } from "@/types/telemetry";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/robots/SARAS-01";

export default function RealtimeManager() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const {
    setTelemetry,
    setPhoneTelemetry,
    setWsConnected,
    setVideoFrame,
    setOperatorContact,
    addLog,
  } = useRobotStore();

  useEffect(() => {
    isMountedRef.current = true;

    const hydrateInitialState = async () => {
      try {
        const data = await apiService.fetchRobotState("SARAS-01");
        if (!isMountedRef.current || !data) return;

        if (data.phoneTelemetry && typeof data.phoneTelemetry === "object") {
          setPhoneTelemetry(data.phoneTelemetry as Partial<PhoneTelemetryData>);
        }

        if (data.telemetry && typeof data.telemetry === "object") {
          setTelemetry(data.telemetry as Partial<TelemetryData>);
          addLog("Initial telemetry hydrated from SARAS backend", "info");
        }
      } catch (err) {
        console.warn("Initial state hydration warning:", err);
      }
    };

    hydrateInitialState();

    const connect = () => {
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) {
            ws.close();
            return;
          }
          setWsConnected(true);
          addLog("Control station connected to SARAS backend", "success");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "connected") {
              setWsConnected(true);
              addLog(
                `Control station verified with SARAS backend (${
                  message.robotId || "SARAS-01"
                })`,
                "success"
              );
            } else if (message.type === "telemetry" && message.data) {
              setTelemetry(message.data as Partial<TelemetryData>);
            } else if (message.type === "phone_telemetry") {
              setPhoneTelemetry(
                (message.data as Partial<PhoneTelemetryData>) ?? {}
              );
            } else if (message.type === "video_frame") {
              setVideoFrame((message.data?.jpegBase64 as string) ?? null);
            } else if (message.type === "operator_contact") {
              setOperatorContact(true);
              addLog("Emergency operator contact requested by Netra", "warning");
            }
          } catch (error) {
            console.warn("Telemetry parse warning:", error);
          }
        };

        ws.onerror = (event) => {
          console.warn("WebSocket connection warning:", event);
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (isMountedRef.current) {
            reconnectTimerRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.warn("Failed to initiate WebSocket connection:", err);
        setWsConnected(false);
        if (isMountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [
    setTelemetry,
    setPhoneTelemetry,
    setWsConnected,
    setVideoFrame,
    setOperatorContact,
    addLog,
  ]);

  return null;
}
