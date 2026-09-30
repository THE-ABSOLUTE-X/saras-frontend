import type { SearchAreaInfo } from "@/components/map/Sarasmap";
import type {
  ManualDrivePayload,
  ManualServoPayload,
  EmergencyStopPayload,
} from "@/types/telemetry";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "saras-dev-key";

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const apiService = {
  getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    };
  },

  async fetchRobotState(robotId = "SARAS-01") {
    try {
      const response = await fetch(`${BACKEND_BASE}/api/v1/robots/${robotId}/state`, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch robot state: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn("fetchRobotState error:", err);
      return null;
    }
  },

  async sendManualDrive(
    direction: "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "STOP",
    speed = 75,
    robotId = "SARAS-01"
  ) {
    const payload: ManualDrivePayload = {
      type: "manual_drive",
      direction,
      speed: Math.max(50, Math.min(100, Math.round(speed))),
      requestId: generateRequestId(),
    };

    try {
      const response = await fetch(
        `${BACKEND_BASE}/api/v1/robots/${robotId}/command?wait_ack=false`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`Manual drive command failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn("sendManualDrive error:", err);
      return null;
    }
  },

  async sendManualServo(
    servo: "HEAD" | "LEFT_HAND" | "RIGHT_HAND" | "BOTH_HANDS",
    angleDeg?: number,
    action?: "HOME" | "UP" | "DOWN",
    robotId = "SARAS-01"
  ) {
    const payload: ManualServoPayload = {
      type: "manual_servo",
      servo,
      angle_deg: angleDeg !== undefined ? Math.max(0, Math.min(180, angleDeg)) : undefined,
      action,
      requestId: generateRequestId(),
    };

    try {
      const response = await fetch(
        `${BACKEND_BASE}/api/v1/robots/${robotId}/command`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`Manual servo command failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn("sendManualServo error:", err);
      return null;
    }
  },

  async sendEmergencyStop(
    reason = "Operator Emergency Stop",
    robotId = "SARAS-01"
  ) {
    const payload: EmergencyStopPayload = {
      command: "EMERGENCY_STOP",
      reason,
      requestId: generateRequestId(),
    };

    try {
      const response = await fetch(
        `${BACKEND_BASE}/api/v1/robots/${robotId}/command`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );
      return await response.json();
    } catch (err) {
      console.error("sendEmergencyStop error:", err);
      return null;
    }
  },

  async submitMission(searchArea: SearchAreaInfo, robotId = "SARAS-01") {
    const payload = {
      robotId,
      searchArea: {
        boundary: [
          { latitude: searchArea.south, longitude: searchArea.west },
          { latitude: searchArea.south, longitude: searchArea.east },
          { latitude: searchArea.north, longitude: searchArea.east },
          { latitude: searchArea.north, longitude: searchArea.west },
        ],
      },
    };

    const response = await fetch(`${BACKEND_BASE}/api/v1/missions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 422) {
        const errData = await response.json().catch(() => null);
        const reason = errData?.detail?.reason || "validation_failed";
        const details = errData?.detail?.details
          ? ` (${JSON.stringify(errData.detail.details)})`
          : "";
        return {
          ok: false,
          status: 422,
          reason: `${reason}${details}`,
        };
      }
      const errText = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        reason: errText || `HTTP ${response.status}`,
      };
    }

    const createdMission = await response.json();
    return {
      ok: true,
      mission: createdMission,
    };
  },
};
