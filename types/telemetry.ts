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
  mq7Digital?: number | null;
  objectDetected?: boolean | null;
  accelerometerX?: number | null;
  accelerometerY?: number | null;
  accelerometerZ?: number | null;
  gyroscopeX?: number | null;
  gyroscopeY?: number | null;
  gyroscopeZ?: number | null;
  roll?: number | null;
  pitch?: number | null;
  mpuTemperature?: number | null;
}

export interface WebSocketTelemetryMessage {
  type: "telemetry" | "operator_contact" | string;
  robotId?: string;
  data?: Partial<TelemetryData>;
}
