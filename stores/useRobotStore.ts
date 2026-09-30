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
      telemetry: {
        ...state.telemetry,
        ...data,
      },
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
