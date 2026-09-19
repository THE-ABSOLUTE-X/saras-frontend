"use client";

import { useState } from "react";

type Direction =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "stop"
  | null;

type HandMode = "Left Hand" | "Both Hands" | "Right Hand";

type ArmPosition = "Up" | "Down" | "Left" | "Right" | "Center";

type Gripper = "Open" | "Closed";

export default function RobotControl() {
  const [direction, setDirection] = useState<Direction>(null);
  const [speed, setSpeed] = useState(50);

  const [headAngle, setHeadAngle] = useState(90);

  const [handMode, setHandMode] =
    useState<HandMode>("Both Hands");

  const [armPosition, setArmPosition] =
    useState<ArmPosition>("Center");

  const [gripper, setGripper] =
    useState<Gripper>("Open");

  /* ================= DRIVE CONTROL ================= */

  const sendCommand = (command: Direction) => {
    setDirection(command);

    // Temporary frontend prototype
    console.log("SARAS DRIVE COMMAND:", command);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (
      event.key === "ArrowUp" ||
      event.key.toLowerCase() === "w"
    ) {
      sendCommand("forward");
    }

    if (
      event.key === "ArrowDown" ||
      event.key.toLowerCase() === "s"
    ) {
      sendCommand("backward");
    }

    if (
      event.key === "ArrowLeft" ||
      event.key.toLowerCase() === "a"
    ) {
      sendCommand("left");
    }

    if (
      event.key === "ArrowRight" ||
      event.key.toLowerCase() === "d"
    ) {
      sendCommand("right");
    }

    if (
      event.key === " " ||
      event.key === "Escape"
    ) {
      sendCommand("stop");
    }
  };

  const commandLabel = {
    forward: "FORWARD",
    backward: "REVERSE",
    left: "LEFT",
    right: "RIGHT",
    stop: "STOP",
  };

  /* ================= HEAD CONTROL ================= */

  const setHead = (angle: number) => {
    const safeAngle = Math.max(0, Math.min(180, angle));

    setHeadAngle(safeAngle);

    console.log(
      "SARAS HEAD COMMAND:",
      safeAngle
    );
  };

  /* ================= ARM CONTROL ================= */

  const setArm = (position: ArmPosition) => {
    setArmPosition(position);

    console.log(
      "SARAS ARM COMMAND:",
      handMode,
      position
    );
  };

  const setGrip = (value: Gripper) => {
    setGripper(value);

    console.log(
      "SARAS GRIPPER COMMAND:",
      handMode,
      value
    );
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="rounded-2xl border border-slate-800/80 bg-[#0B1222] p-4 outline-none"
    >

      {/* ================= HEADER ================= */}

      <div className="mb-4 flex flex-col gap-3 border-b border-slate-800/70 pb-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Manual Operations
          </p>

          <h3 className="mt-1 text-base font-semibold text-white">
            Robot Control Center
          </h3>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

          <span className="text-[10px] font-semibold text-green-400">
            CONTROL READY
          </span>
        </div>

      </div>


      {/* ================= THREE CONTROL PANELS ================= */}

      <div className="grid gap-3 lg:grid-cols-3">


        {/* ================================================= */}
        {/* DRIVE PANEL */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-4">

          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Rover
            </p>

            <h4 className="mt-1 text-sm font-semibold text-white">
              Drive Control
            </h4>

            <p className="mt-1 text-[10px] text-slate-500">
              Manual movement
            </p>
          </div>


          {/* Current Command */}

          <div className="mb-4 rounded-lg border border-slate-800 bg-[#030817] px-3 py-2 text-center">

            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              Current Command
            </p>

            <p className="mt-1 text-sm font-bold text-cyan-400">
              {direction
                ? commandLabel[direction]
                : "IDLE"}
            </p>

          </div>


          {/* Direction Pad */}

          <div className="mx-auto grid w-fit grid-cols-3 gap-1.5">

            <div />

            <button
              type="button"
              onMouseDown={() => sendCommand("forward")}
              onMouseUp={() => sendCommand("stop")}
              onMouseLeave={() => sendCommand("stop")}
              onTouchStart={() => sendCommand("forward")}
              onTouchEnd={() => sendCommand("stop")}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xl text-white transition hover:border-cyan-700 hover:bg-slate-700 active:bg-cyan-600"
            >
              ↑
            </button>

            <div />

            <button
              type="button"
              onMouseDown={() => sendCommand("left")}
              onMouseUp={() => sendCommand("stop")}
              onMouseLeave={() => sendCommand("stop")}
              onTouchStart={() => sendCommand("left")}
              onTouchEnd={() => sendCommand("stop")}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xl text-white transition hover:border-cyan-700 hover:bg-slate-700 active:bg-cyan-600"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => sendCommand("stop")}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-red-900/80 bg-red-950/70 text-[10px] font-bold text-red-400 transition hover:bg-red-900"
            >
              STOP
            </button>

            <button
              type="button"
              onMouseDown={() => sendCommand("right")}
              onMouseUp={() => sendCommand("stop")}
              onMouseLeave={() => sendCommand("stop")}
              onTouchStart={() => sendCommand("right")}
              onTouchEnd={() => sendCommand("stop")}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xl text-white transition hover:border-cyan-700 hover:bg-slate-700 active:bg-cyan-600"
            >
              →
            </button>

            <div />

            <button
              type="button"
              onMouseDown={() => sendCommand("backward")}
              onMouseUp={() => sendCommand("stop")}
              onMouseLeave={() => sendCommand("stop")}
              onTouchStart={() => sendCommand("backward")}
              onTouchEnd={() => sendCommand("stop")}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xl text-white transition hover:border-cyan-700 hover:bg-slate-700 active:bg-cyan-600"
            >
              ↓
            </button>

            <div />

          </div>


          {/* Speed */}

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                Speed
              </span>

              <span className="text-xs font-bold text-cyan-400">
                {speed}%
              </span>

            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(event) =>
                setSpeed(
                  Number(event.target.value)
                )
              }
              className="w-full accent-cyan-500"
            />

          </div>


          <p className="mt-4 text-center text-[9px] text-slate-600">
            W A S D • Arrow Keys • Space / Esc
          </p>

        </div>


        {/* ================================================= */}
        {/* HEAD PANEL */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-4">

          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Camera / Head
            </p>

            <h4 className="mt-1 text-sm font-semibold text-white">
              Head Movement
            </h4>

            <p className="mt-1 text-[10px] text-slate-500">
              180° horizontal rotation
            </p>
          </div>


          {/* Angle Display */}

          <div className="flex items-center justify-center">

            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/5">

              <span className="text-[9px] uppercase tracking-wider text-slate-500">
                Angle
              </span>

              <span className="mt-1 text-2xl font-bold text-cyan-400">
                {headAngle}°
              </span>

            </div>

          </div>


          {/* Slider */}

          <div className="mt-5">

            <input
              type="range"
              min="0"
              max="180"
              value={headAngle}
              onChange={(event) =>
                setHead(
                  Number(event.target.value)
                )
              }
              className="w-full accent-cyan-500"
            />

            <div className="mt-2 flex justify-between text-[9px] text-slate-600">
              <span>0° LEFT</span>
              <span>90° CENTER</span>
              <span>180° RIGHT</span>
            </div>

          </div>


          {/* Head Presets */}

          <div className="mt-4 grid grid-cols-3 gap-1.5">

            <button
              type="button"
              onClick={() => setHead(0)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
            >
              ← Left
            </button>

            <button
              type="button"
              onClick={() => setHead(90)}
              className="rounded-lg border border-cyan-800 bg-cyan-950/70 px-2 py-2 text-[10px] font-semibold text-cyan-400"
            >
              Center
            </button>

            <button
              type="button"
              onClick={() => setHead(180)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
            >
              Right →
            </button>

          </div>

        </div>


        {/* ================================================= */}
        {/* ARM / HAND PANEL */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-800 bg-[#070D1C] p-4">

          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Manipulator
            </p>

            <h4 className="mt-1 text-sm font-semibold text-white">
              Arm / Hand Control
            </h4>

            <p className="mt-1 text-[10px] text-slate-500">
              Select active hand
            </p>
          </div>


          {/* Hand Selector */}

          <div className="grid grid-cols-3 gap-1">

            {(
              [
                "Left Hand",
                "Both Hands",
                "Right Hand",
              ] as HandMode[]
            ).map((hand) => (

              <button
                key={hand}
                type="button"
                onClick={() => setHandMode(hand)}
                className={`rounded-lg border px-1 py-2 text-[9px] font-semibold transition ${
                  handMode === hand
                    ? "border-cyan-700 bg-cyan-950 text-cyan-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {hand === "Left Hand"
                  ? "LEFT"
                  : hand === "Right Hand"
                    ? "RIGHT"
                    : "BOTH"}
              </button>

            ))}

          </div>


          {/* Active Hand */}

          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-center">

            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              Active
            </p>

            <p className="mt-1 text-xs font-bold text-cyan-400">
              {handMode}
            </p>

          </div>


          {/* Arm Direction */}

          <div className="mt-4">

            <div className="mx-auto grid w-fit grid-cols-3 gap-1.5">

              <div />

              <button
                type="button"
                onClick={() => setArm("Up")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg text-white hover:bg-slate-700 active:bg-cyan-600"
              >
                ↑
              </button>

              <div />

              <button
                type="button"
                onClick={() => setArm("Left")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg text-white hover:bg-slate-700 active:bg-cyan-600"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => setArm("Center")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-800 bg-cyan-950 text-[9px] font-bold text-cyan-400"
              >
                CTR
              </button>

              <button
                type="button"
                onClick={() => setArm("Right")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg text-white hover:bg-slate-700 active:bg-cyan-600"
              >
                →
              </button>

              <div />

              <button
                type="button"
                onClick={() => setArm("Down")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg text-white hover:bg-slate-700 active:bg-cyan-600"
              >
                ↓
              </button>

              <div />

            </div>

          </div>


          {/* Gripper */}

          <div className="mt-4 grid grid-cols-2 gap-1.5">

            <button
              type="button"
              onClick={() => setGrip("Open")}
              className={`rounded-lg border py-2 text-[10px] font-semibold ${
                gripper === "Open"
                  ? "border-cyan-700 bg-cyan-950 text-cyan-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              ✋ OPEN
            </button>

            <button
              type="button"
              onClick={() => setGrip("Closed")}
              className={`rounded-lg border py-2 text-[10px] font-semibold ${
                gripper === "Closed"
                  ? "border-red-800 bg-red-950 text-red-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              ✊ CLOSE
            </button>

          </div>


          {/* Arm Status */}

          <div className="mt-3 flex justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-[9px]">

            <span className="text-slate-500">
              POS:{" "}
              <span className="font-semibold text-white">
                {armPosition}
              </span>
            </span>

            <span className="text-slate-500">
              GRIP:{" "}
              <span className="font-semibold text-cyan-400">
                {gripper}
              </span>
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}