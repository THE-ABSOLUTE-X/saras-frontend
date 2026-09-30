import { create } from "zustand";
import type { TelemetryData, PhoneTelemetryData } from "@/types/telemetry";
import type { SearchAreaInfo } from "@/components/map/Sarasmap";
import type { LogEntry, LogType } from "@/components/logs/ActivityLog";
import type { MissionSubmissionStatus } from "@/components/mission/MissionStatus";

interface RobotStoreState {
  // Telemetry
  telemetry: TelemetryData;
  phoneTelemetry: PhoneTelemetryData;
  wsConnected: boolean;
  videoFrame: string | null;
  operatorContact: boolean;

  // Mission
  searchArea: SearchAreaInfo | null;
  missionStatus: MissionSubmissionStatus;
  missionId: string | null;
  missionMessage: string | null;

  // Logs
  logs: LogEntry[];

  // Manual Control State
  headAngle: number;
  armPosition: string;
  gripperState: "Open" | "Closed";
  activeHand: "Left Hand" | "Both Hands" | "Right Hand";
  manualDriveSpeed: number;
  lastDriveCommand: string | null;

  // Actions
  setTelemetry: (data: Partial<TelemetryData>) => void;
  setPhoneTelemetry: (data: Partial<PhoneTelemetryData>) => void;
  setWsConnected: (connected: boolean) => void;
  setVideoFrame: (frame: string | null) => void;
  setOperatorContact: (contact: boolean) => void;
  setSearchArea: (area: SearchAreaInfo | null) => void;
  setMissionStatus: (
    status: MissionSubmissionStatus,
    message?: string | null,
    missionId?: string | null
  ) => void;
  addLog: (message: string, type?: LogType) => void;
  clearLogs: () => void;
  setHeadAngle: (angle: number) => void;
  setArmPosition: (position: string) => void;
  setGripperState: (gripper: "Open" | "Closed") => void;
  setActiveHand: (hand: "Left Hand" | "Both Hands" | "Right Hand") => void;
  setManualDriveSpeed: (speed: number) => void;
  setLastDriveCommand: (cmd: string | null) => void;
}

const initialTelemetry: TelemetryData = {
  timestamp: null,
  latitude: null,
  longitude: null,
  temperature: null,
  humidity: null,
  gasLevel: null,
  flameDetected: null,
  ultrasonicDistance: null,
  batteryLevel: null,
  robotConnected: false,
  robotStatus: "offline",
  sequence: null,
  mq7Digital: null,
  objectDetected: null,
  accelerometerX: null,
  accelerometerY: null,
  accelerometerZ: null,
  gyroscopeX: null,
  gyroscopeY: null,
  gyroscopeZ: null,
  roll: null,
  pitch: null,
  mpuTemperature: null,
  batteryVoltage: null,
  batteryStatus: null,
  safetyState: null,
  emergencyStop: false,
  motionState: "IDLE",
  obstacleMode: null,
};

function normalizeTelemetryData(
  prev: TelemetryData,
  incoming: Partial<TelemetryData>
): TelemetryData {
  const merged: TelemetryData = { ...prev, ...incoming };

  // 1. IMU normalization (flat roll/pitch <-> canonical imu.orientation)
  const orient = incoming.imu?.orientation;
  if (merged.roll === null && orient?.roll_deg !== undefined && orient?.roll_deg !== null) {
    merged.roll = orient.roll_deg;
  }
  if (merged.pitch === null && orient?.pitch_deg !== undefined && orient?.pitch_deg !== null) {
    merged.pitch = orient.pitch_deg;
  }

  // Canonical IMU registers
  const accel = incoming.imu?.acceleration;
  if (merged.accelerometerX === null && accel?.x_g !== undefined && accel?.x_g !== null) {
    merged.accelerometerX = accel.x_g;
  }
  if (merged.accelerometerY === null && accel?.y_g !== undefined && accel?.y_g !== null) {
    merged.accelerometerY = accel.y_g;
  }
  if (merged.accelerometerZ === null && accel?.z_g !== undefined && accel?.z_g !== null) {
    merged.accelerometerZ = accel.z_g;
  }

  const gyro = incoming.imu?.gyroscope;
  if (merged.gyroscopeX === null && gyro?.x_dps !== undefined && gyro?.x_dps !== null) {
    merged.gyroscopeX = gyro.x_dps;
  }
  if (merged.gyroscopeY === null && gyro?.y_dps !== undefined && gyro?.y_dps !== null) {
    merged.gyroscopeY = gyro.y_dps;
  }
  if (merged.gyroscopeZ === null && gyro?.z_dps !== undefined && gyro?.z_dps !== null) {
    merged.gyroscopeZ = gyro.z_dps;
  }

  if (merged.mpuTemperature === null && incoming.imu?.temperature_c !== undefined && incoming.imu?.temperature_c !== null) {
    merged.mpuTemperature = incoming.imu.temperature_c;
  }

  // 2. Battery normalization (flat <-> canonical battery)
  if (merged.batteryLevel === null && incoming.battery?.percentage !== undefined && incoming.battery?.percentage !== null) {
    merged.batteryLevel = incoming.battery.percentage;
  }
  if (merged.batteryVoltage === null && incoming.battery?.voltage !== undefined && incoming.battery?.voltage !== null) {
    merged.batteryVoltage = incoming.battery.voltage;
  }
  if (merged.batteryStatus === null && incoming.battery?.status !== undefined && incoming.battery?.status !== null) {
    merged.batteryStatus = incoming.battery.status;
  }

  // 3. Environment normalization (flat <-> canonical environment)
  const env = incoming.environment;
  if (merged.temperature === null && env?.temperature_c !== undefined && env?.temperature_c !== null) {
    merged.temperature = env.temperature_c;
  }
  if (merged.humidity === null && env?.humidity_percent !== undefined && env?.humidity_percent !== null) {
    merged.humidity = env.humidity_percent;
  }
  if (merged.gasLevel === null && env?.mq7_analog !== undefined && env?.mq7_analog !== null) {
    merged.gasLevel = env.mq7_analog;
  }
  if (merged.flameDetected === null && env?.flame_detected !== undefined && env?.flame_detected !== null) {
    merged.flameDetected = env.flame_detected;
  }

  // 4. Motion & Safety normalization
  if (merged.motionState === null && incoming.motion?.state !== undefined && incoming.motion?.state !== null) {
    merged.motionState = incoming.motion.state;
  }
  if (merged.safetyState === null && incoming.safety?.state !== undefined && incoming.safety?.state !== null) {
    merged.safetyState = incoming.safety.state;
  }
  if (merged.objectDetected === null && incoming.safety?.obstacle_detected !== undefined && incoming.safety?.obstacle_detected !== null) {
    merged.objectDetected = incoming.safety.obstacle_detected;
  }
  if (merged.emergencyStop === null && incoming.safety?.emergency_stop !== undefined && incoming.safety?.emergency_stop !== null) {
    merged.emergencyStop = incoming.safety.emergency_stop;
  }
  if (merged.ultrasonicDistance === null && incoming.safety?.front_distance_cm !== undefined && incoming.safety?.front_distance_cm !== null) {
    merged.ultrasonicDistance = incoming.safety.front_distance_cm;
  }

  // 5. Obstacle avoidance mode
  if (merged.obstacleMode === null && incoming.obstacle_avoidance?.mode !== undefined && incoming.obstacle_avoidance?.mode !== null) {
    merged.obstacleMode = incoming.obstacle_avoidance.mode;
  }

  return merged;
}

export const useRobotStore = create<RobotStoreState>((set) => ({
  telemetry: initialTelemetry,
  phoneTelemetry: {},
  wsConnected: false,
  videoFrame: null,
  operatorContact: false,

  searchArea: null,
  missionStatus: "NOT_SELECTED",
  missionId: null,
  missionMessage: null,

  logs: [
    {
      id: "init",
      time: new Date().toTimeString().split(" ")[0],
      message: "SARAS Operator Control System initialized",
      type: "info",
    },
  ],

  headAngle: 90,
  armPosition: "Center",
  gripperState: "Open",
  activeHand: "Both Hands",
  manualDriveSpeed: 75,
  lastDriveCommand: null,

  setTelemetry: (data) =>
    set((state) => ({
      telemetry: normalizeTelemetryData(state.telemetry, data),
    })),

  setPhoneTelemetry: (data) =>
    set((state) => ({
      phoneTelemetry: {
        ...state.phoneTelemetry,
        ...data,
      },
    })),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  setVideoFrame: (frame) => set({ videoFrame: frame }),

  setOperatorContact: (contact) => set({ operatorContact: contact }),

  setSearchArea: (area) =>
    set({
      searchArea: area,
      missionStatus: area ? "SELECTED" : "NOT_SELECTED",
      missionMessage: area
        ? `Search rectangle defined: ${Math.round(area.widthMeters)}m × ${Math.round(
            area.heightMeters
          )}m (${Math.round(area.areaSquareMeters)} m²)`
        : null,
    }),

  setMissionStatus: (status, message = null, missionId = null) =>
    set((state) => ({
      missionStatus: status,
      missionMessage: message !== undefined ? message : state.missionMessage,
      missionId: missionId !== undefined ? missionId : state.missionId,
    })),

  addLog: (message, type = "info") => {
    const now = new Date();
    const time = now.toTimeString().split(" ")[0];
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time,
      message,
      type,
    };
    set((state) => ({
      logs: [newEntry, ...state.logs.slice(0, 49)],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  setHeadAngle: (headAngle) => set({ headAngle }),
  setArmPosition: (armPosition) => set({ armPosition }),
  setGripperState: (gripperState) => set({ gripperState }),
  setActiveHand: (activeHand) => set({ activeHand }),
  setManualDriveSpeed: (manualDriveSpeed) => set({ manualDriveSpeed }),
  setLastDriveCommand: (lastDriveCommand) => set({ lastDriveCommand }),
}));
