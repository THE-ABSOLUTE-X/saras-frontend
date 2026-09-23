export type RobotStatus =
  | "idle"
  | "active"
  | "warning"
  | "charging"
  | "stopped"
  | "offline";

export interface TelemetryData {
  timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  temperature: number | null;
  humidity: number | null;
  gasLevel: number | null;
  flameDetected: boolean | null;
  ultrasonicDistance: number | null;
  batteryLevel: number | null;
  robotConnected: boolean | null;
  robotStatus: RobotStatus | string | null;
  sequence: number | null;
}

export interface WebSocketTelemetryMessage {
  type: "telemetry" | "operator_contact" | string;
  robotId?: string;
  data?: Partial<TelemetryData>;
}
