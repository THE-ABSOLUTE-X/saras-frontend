"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import RoverViewer from "@/components/3d/RoverViewer";
import { useRobotStore } from "@/stores/useRobotStore";
import { apiService } from "@/services/apiService";
import {
  Gamepad2,
  Video,
  VideoOff,
  Compass,
} from "lucide-react";

type Direction = "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "STOP";

export default function ControlPage() {
  const {
    telemetry,
    videoFrame,
    wsConnected,
    headAngle,
    setHeadAngle,
    armPosition,
    setArmPosition,
    activeHand,
    setActiveHand,
    gripperState,
    setGripperState,
    manualDriveSpeed,
    setManualDriveSpeed,
    setLastDriveCommand,
    addLog,
  } = useRobotStore();

  const isOnline = wsConnected && telemetry.robotConnected === true;

  // Active driving state
  const [activeDirection, setActiveDirection] = useState<Direction>("STOP");
  const driveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeDirectionRef = useRef<Direction>("STOP");
  const speedRef = useRef<number>(manualDriveSpeed);

  useEffect(() => {
    speedRef.current = manualDriveSpeed;
  }, [manualDriveSpeed]);

  // Send single drive command helper
  const sendDriveFrame = useCallback(
    async (dir: Direction, spd: number) => {
      try {
        await apiService.sendManualDrive(dir, spd);
      } catch (err) {
        console.warn("Failed to dispatch drive frame:", err);
      }
    },
    []
  );

  // Watchdog loop: start continuous pulse when direction is active
  const startContinuousDrive = useCallback(
    (dir: Direction) => {
      if (activeDirectionRef.current === dir && driveIntervalRef.current) {
        return;
      }

      activeDirectionRef.current = dir;
      setActiveDirection(dir);
      setLastDriveCommand(dir);

      if (driveIntervalRef.current) {
        clearInterval(driveIntervalRef.current);
        driveIntervalRef.current = null;
      }

      if (dir === "STOP") {
        sendDriveFrame("STOP", speedRef.current);
        return;
      }

      // Send initial frame immediately
      sendDriveFrame(dir, speedRef.current);
      addLog(`Manual drive engaged: ${dir} @ ${speedRef.current}%`, "info");

      // Firmware watchdog requires heartbeat within 1500ms. Send every 120ms.
      driveIntervalRef.current = setInterval(() => {
        if (activeDirectionRef.current !== "STOP") {
          sendDriveFrame(activeDirectionRef.current, speedRef.current);
        }
      }, 120);
    },
    [sendDriveFrame, setLastDriveCommand, addLog]
  );

  // Stop driving and immediately cancel interval
  const stopDriving = useCallback(() => {
    if (driveIntervalRef.current) {
      clearInterval(driveIntervalRef.current);
      driveIntervalRef.current = null;
    }
    if (activeDirectionRef.current !== "STOP") {
      activeDirectionRef.current = "STOP";
      setActiveDirection("STOP");
      setLastDriveCommand("STOP");
      sendDriveFrame("STOP", 0);
      addLog("Manual drive stopped", "info");
    }
  }, [sendDriveFrame, setLastDriveCommand, addLog]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (driveIntervalRef.current) {
        clearInterval(driveIntervalRef.current);
      }
      sendDriveFrame("STOP", 0);
    };
  }, [sendDriveFrame]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // avoid OS repeat events interfering with watchdog
      const key = e.key.toLowerCase();

      if (key === "w" || key === "arrowup") {
        e.preventDefault();
        startContinuousDrive("FORWARD");
      } else if (key === "s" || key === "arrowdown") {
        e.preventDefault();
        startContinuousDrive("BACKWARD");
      } else if (key === "a" || key === "arrowleft") {
        e.preventDefault();
        startContinuousDrive("LEFT");
      } else if (key === "d" || key === "arrowright") {
        e.preventDefault();
        startContinuousDrive("RIGHT");
      } else if (key === " " || key === "escape") {
        e.preventDefault();
        stopDriving();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          key
        )
      ) {
        stopDriving();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startContinuousDrive, stopDriving]);

  // ================= ANALOG JOYSTICK DRAG LOGIC =================
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);

  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    setIsDraggingJoystick(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingJoystick) return;
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2 - 25; // bounds

    const dist = Math.hypot(dx, dy);
    const angleRad = Math.atan2(dy, dx); // radians from positive X axis

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = clampedDist * Math.cos(angleRad);
    const knobY = clampedDist * Math.sin(angleRad);

    setKnobPos({ x: knobX, y: knobY });

    // Determine direction from angle
    const normalizedDist = clampedDist / maxRadius;
    if (normalizedDist < 0.2) {
      if (activeDirectionRef.current !== "STOP") {
        stopDriving();
      }
      return;
    }

    // Angle degrees in -180 to 180
    const angleDeg = (angleRad * 180) / Math.PI;

    let dir: Direction = "STOP";
    if (angleDeg >= -135 && angleDeg <= -45) {
      dir = "FORWARD";
    } else if (angleDeg >= 45 && angleDeg <= 135) {
      dir = "BACKWARD";
    } else if (angleDeg > 135 || angleDeg < -135) {
      dir = "LEFT";
    } else {
      dir = "RIGHT";
    }

    startContinuousDrive(dir);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    setIsDraggingJoystick(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setKnobPos({ x: 0, y: 0 });
    stopDriving();
  };

  // ================= SERVO DISPATCH =================
  const handleHeadChange = async (angle: number) => {
    setHeadAngle(angle);
    try {
      await apiService.sendManualServo("HEAD", angle);
    } catch (err) {
      console.warn("Head servo command failed:", err);
    }
  };

  const handleArmAction = async (action: "HOME" | "UP" | "DOWN", label: string) => {
    setArmPosition(label);
    const servoTarget =
      activeHand === "Left Hand"
        ? "LEFT_HAND"
        : activeHand === "Right Hand"
          ? "RIGHT_HAND"
          : "BOTH_HANDS";
    try {
      await apiService.sendManualServo(servoTarget, undefined, action);
      addLog(`Manipulator [${activeHand}] moved: ${label}`, "info");
    } catch (err) {
      console.warn("Arm servo command failed:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                SARAS Operational Mode
              </span>
              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                MANUAL TELEOP
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Direct Rover Drive & Teleoperation
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Low-latency continuous manual drive, servo articulation, and 3D MPU6050 attitude feedback.
            </p>
          </div>

          {/* Comms indicator */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0B1222] p-3 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <div className="font-mono">
              <span className="text-slate-400">STATUS: </span>
              <span className="font-bold text-white">
                {isOnline ? "FIRMWARE READY (120ms WATCHDOG)" : "ROVER OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* Top Grid: Camera Stream & 3D Attitude Model */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Live Rover Video Feed */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  ROVER FORWARD VISION
                </h3>
              </div>
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                {videoFrame ? "LIVE WS STREAM" : "STANDBY"}
              </span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              {videoFrame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/jpeg;base64,${videoFrame}`}
                  alt="Live Camera Feed"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <VideoOff size={32} />
                  <p className="font-mono text-xs">Awaiting video frames from rover/phone</p>
                </div>
              )}

              {/* HUD Overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <div className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-cyan-400 backdrop-blur-sm">
                  HEAD: {headAngle}°
                </div>
              </div>

              <div className="absolute bottom-2 right-2">
                <div className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                  CMD: {activeDirection}
                </div>
              </div>
            </div>
          </div>

          {/* 3D Rover MPU6050 Orientation Model */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  3D VEHICLE ATTITUDE & MAST
                </h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                INTERACTIVE THREE.JS VIEW
              </span>
            </div>

            <RoverViewer
              roll={telemetry.roll}
              pitch={telemetry.pitch}
              headAngle={headAngle}
              armPosition={armPosition}
              className="h-[280px] w-full"
            />
          </div>
        </div>

        {/* Bottom Grid: Controls (Drive Joystick, Speed, Head Servo, Manipulator) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* PANEL 1: ANALOG JOYSTICK & DRIVE CONTROL */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                Drive Joystick
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                TOUCH & MOUSE
              </span>
            </div>

            {/* Circular Joystick */}
            <div
              ref={joystickBaseRef}
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerUp}
              className="relative flex h-52 w-52 cursor-pointer items-center justify-center rounded-full border-2 border-slate-700 bg-gradient-to-b from-[#091122] to-[#040814] shadow-inner select-none touch-none"
            >
              {/* Direction Marks */}
              <span className="absolute top-2 text-[10px] font-bold text-slate-500">
                FWD
              </span>
              <span className="absolute bottom-2 text-[10px] font-bold text-slate-500">
                REV
              </span>
              <span className="absolute left-2 text-[10px] font-bold text-slate-500">
                LEFT
              </span>
              <span className="absolute right-2 text-[10px] font-bold text-slate-500">
                RIGHT
              </span>

              {/* Crosshair guide lines */}
              <div className="absolute h-full w-[1px] bg-slate-800/60 pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-slate-800/60 pointer-events-none" />
              <div className="absolute h-28 w-28 rounded-full border border-slate-800/80 pointer-events-none" />

              {/* Draggable Knob */}
              <div
                style={{
                  transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                  transition: isDraggingJoystick ? "none" : "transform 0.15s ease-out",
                }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
                  activeDirection !== "STOP"
                    ? "border-cyan-400 bg-cyan-500 text-black shadow-cyan-500/50"
                    : "border-slate-600 bg-slate-800 text-slate-300 shadow-black/80"
                }`}
              >
                <Gamepad2 size={24} />
              </div>
            </div>

            {/* Drive Status & Speed Slider */}
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#070D1C] px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  Active Motion
                </span>
                <span
                  className={`font-mono text-xs font-black ${
                    activeDirection !== "STOP"
                      ? "text-cyan-400 animate-pulse"
                      : "text-slate-400"
                  }`}
                >
                  {activeDirection}
                </span>
              </div>

              {/* Speed control */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>DRIVE SPEED</span>
                  <span className="font-bold text-cyan-400">
                    {manualDriveSpeed}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={manualDriveSpeed}
                  onChange={(e) => setManualDriveSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>50% (PRECISION)</span>
                  <span>75% (CRUISE)</span>
                  <span>100% (BOOST)</span>
                </div>
              </div>

              {/* D-Pad Buttons as quick backup */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div />
                <button
                  type="button"
                  onMouseDown={() => startContinuousDrive("FORWARD")}
                  onMouseUp={stopDriving}
                  onTouchStart={() => startContinuousDrive("FORWARD")}
                  onTouchEnd={stopDriving}
                  className="rounded border border-slate-800 bg-slate-900 py-2 text-xs font-bold hover:bg-slate-800 active:bg-cyan-600"
                >
                  ▲
                </button>
                <div />
                <button
                  type="button"
                  onMouseDown={() => startContinuousDrive("LEFT")}
                  onMouseUp={stopDriving}
                  onTouchStart={() => startContinuousDrive("LEFT")}
                  onTouchEnd={stopDriving}
                  className="rounded border border-slate-800 bg-slate-900 py-2 text-xs font-bold hover:bg-slate-800 active:bg-cyan-600"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={stopDriving}
                  className="rounded border border-red-900 bg-red-950 py-2 text-[10px] font-bold text-red-400 hover:bg-red-900"
                >
                  STOP
                </button>
                <button
                  type="button"
                  onMouseDown={() => startContinuousDrive("RIGHT")}
                  onMouseUp={stopDriving}
                  onTouchStart={() => startContinuousDrive("RIGHT")}
                  onTouchEnd={stopDriving}
                  className="rounded border border-slate-800 bg-slate-900 py-2 text-xs font-bold hover:bg-slate-800 active:bg-cyan-600"
                >
                  ▶
                </button>
                <div />
                <button
                  type="button"
                  onMouseDown={() => startContinuousDrive("BACKWARD")}
                  onMouseUp={stopDriving}
                  onTouchStart={() => startContinuousDrive("BACKWARD")}
                  onTouchEnd={stopDriving}
                  className="rounded border border-slate-800 bg-slate-900 py-2 text-xs font-bold hover:bg-slate-800 active:bg-cyan-600"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>
          </div>

          {/* PANEL 2: HEAD / CAMERA SERVO */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 flex flex-col justify-between">
            <div>
              <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Head / Mast Servo
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  180° ROTATION
                </span>
              </div>

              {/* Head Angle Dial */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/5 shadow-lg shadow-cyan-500/10">
                  <span className="font-mono text-[10px] text-slate-500">
                    PAN ANGLE
                  </span>
                  <span className="font-mono text-3xl font-black text-cyan-400">
                    {headAngle}°
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={headAngle}
                  onChange={(e) => handleHeadChange(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0° LEFT</span>
                  <span>90° CENTER</span>
                  <span>180° RIGHT</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleHeadChange(0)}
                  className="rounded-lg border border-slate-800 bg-slate-900 py-2 font-mono text-xs font-semibold hover:border-slate-700 hover:text-white"
                >
                  Left (0°)
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadChange(90)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 font-mono text-xs font-bold text-cyan-400 hover:bg-cyan-500/20"
                >
                  Center (90°)
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadChange(180)}
                  className="rounded-lg border border-slate-800 bg-slate-900 py-2 font-mono text-xs font-semibold hover:border-slate-700 hover:text-white"
                >
                  Right (180°)
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-3 text-xs text-slate-400 mt-4">
              <span className="font-semibold text-slate-200">Servo Watchdog: </span>
              Mast automatically preserves camera alignment with forward rover chassis heading.
            </div>
          </div>

          {/* PANEL 3: ROBOTIC MANIPULATOR ARMS */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1222] p-5 flex flex-col justify-between">
            <div>
              <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Manipulator Servos
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  DUAL ARMS
                </span>
              </div>

              {/* Active Hand Mode */}
              <div className="mb-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                  Target Limb:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(["Left Hand", "Both Hands", "Right Hand"] as const).map(
                    (hand) => (
                      <button
                        key={hand}
                        type="button"
                        onClick={() => setActiveHand(hand)}
                        className={`rounded-lg border py-2 text-[10px] font-bold uppercase transition ${
                          activeHand === hand
                            ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {hand}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Position Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Articulated Presets:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleArmAction("UP", "Up")}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-3 hover:border-slate-700 hover:text-white"
                  >
                    <span className="text-base">▲</span>
                    <span className="font-mono text-[10px] mt-1">UP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArmAction("HOME", "Center")}
                    className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    <span className="text-base">■</span>
                    <span className="font-mono text-[10px] mt-1 font-bold">
                      HOME
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArmAction("DOWN", "Down")}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-3 hover:border-slate-700 hover:text-white"
                  >
                    <span className="text-base">▼</span>
                    <span className="font-mono text-[10px] mt-1">DOWN</span>
                  </button>
                </div>
              </div>

              {/* Gripper Open / Close */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  End Effector Gripper:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGripperState("Open")}
                    className={`rounded-xl border py-2.5 font-mono text-xs font-bold transition ${
                      gripperState === "Open"
                        ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-400"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    ✋ OPEN CLAW
                  </button>
                  <button
                    type="button"
                    onClick={() => setGripperState("Closed")}
                    className={`rounded-xl border py-2.5 font-mono text-xs font-bold transition ${
                      gripperState === "Closed"
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    ✊ CLOSE CLAW
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-3 text-xs flex justify-between items-center mt-4">
              <span className="font-mono text-slate-400">POSITION:</span>
              <span className="font-mono font-bold text-cyan-400">
                {armPosition}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
