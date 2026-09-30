export type RobotStatus =
  | "idle"
  | "active"
  | "warning"
  | "charging"
  | "stopped"
  | "offline";

export interface BatteryTelemetry {
  percentage?: number | null;
  voltage?: number | null;
  status?: string | null;
}

export interface MotionTelemetry {
  state?: string | null;
}

export interface SafetyTelemetry {
  state?: string | null;
  obstacle_detected?: boolean | null;
  emergency_stop?: boolean | null;
  front_distance_cm?: number | null;
}

export interface ObstacleAvoidanceTelemetry {
  mode?: string | null;
}

export interface EnvironmentTelemetry {
  temperature_c?: number | null;
  humidity_percent?: number | null;
  mq7_analog?: number | null;
  mq7_digital?: number | boolean | null;
  flame_detected?: boolean | null;
}

export interface ImuAcceleration {
  x_g?: number | null;
  y_g?: number | null;
  z_g?: number | null;
}

export interface ImuGyroscope {
  x_dps?: number | null;
  y_dps?: number | null;
  z_dps?: number | null;
}

export interface ImuOrientation {
  roll_deg?: number | null;
  pitch_deg?: number | null;
}

export interface ImuTelemetry {
  acceleration?: ImuAcceleration | null;
  gyroscope?: ImuGyroscope | null;
  orientation?: ImuOrientation | null;
  temperature_c?: number | null;
}

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

  // Canonical structured sub-models (exact parity with backend Telemetry)
  battery?: BatteryTelemetry | null;
  motion?: MotionTelemetry | null;
  safety?: SafetyTelemetry | null;
  obstacle_avoidance?: ObstacleAvoidanceTelemetry | null;
  environment?: EnvironmentTelemetry | null;
  imu?: ImuTelemetry | null;
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
  heading?: number | string | null;
  pitch?: number | string | null;
  roll?: number | string | null;
  deviceOrientation?: string | null;
  speed?: number | null;
  deviceModel?: string | null;
  timestamp?: string | null;
  personDetected?: boolean | null;
  personCount?: number | null;
  confidence?: number | null;
  cameraAvailable?: boolean | null;
  microphoneAvailable?: boolean | null;
  accelerometer?: string | { x: number; y: number; z: number } | null;
  gyroscope?: string | { x: number; y: number; z: number } | null;
  magnetometer?: string | { x: number; y: number; z: number } | null;
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
