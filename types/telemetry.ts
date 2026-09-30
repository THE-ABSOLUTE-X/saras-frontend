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
  mq7Digital?: number | boolean | null;
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
  batteryVoltage?: number | null;
  batteryStatus?: string | null;
  safetyState?: string | null;
  emergencyStop?: boolean | null;
  motionState?: string | null;
  obstacleMode?: string | null;
}

export interface PhoneTelemetryData {
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
  batteryLevel?: number | null;
  batteryStatus?: string | null;
  networkType?: string | null;
  signalStrength?: number | null;
  heading?: number | null;
  speed?: number | null;
  deviceModel?: string | null;
  timestamp?: string | null;
  personDetected?: boolean | null;
  confidence?: number | null;
  [key: string]: unknown;
}

export interface WebSocketTelemetryMessage {
  type: "telemetry" | "operator_contact" | "phone_telemetry" | "video_frame" | "connected" | string;
  robotId?: string;
  data?: Partial<TelemetryData> | PhoneTelemetryData | { jpegBase64?: string } | Record<string, unknown>;
}

export interface ManualDrivePayload {
  type: "manual_drive";
  direction: "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "STOP";
  speed: number;
  requestId: string;
}

export interface ManualServoPayload {
  type: "manual_servo";
  servo: "HEAD" | "LEFT_HAND" | "RIGHT_HAND" | "BOTH_HANDS";
  angle_deg?: number;
  action?: "HOME" | "UP" | "DOWN";
  requestId: string;
}

export interface EmergencyStopPayload {
  command: "EMERGENCY_STOP";
  reason?: string;
  requestId: string;
}
