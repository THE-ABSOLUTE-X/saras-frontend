"use client";

import { useState } from "react";

type Direction =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "stop"
  | null;

export default function RobotControl() {
  const [direction, setDirection] = useState<Direction>(null);
  const [speed, setSpeed] = useState(50);

  const sendCommand = (command: Direction) => {
    setDirection(command);

    // Temporary frontend prototype
    console.log("SARAS COMMAND:", command);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      sendCommand("forward");
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      sendCommand("backward");
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      sendCommand("left");
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      sendCommand("right");
    }

    if (event.key === " " || event.key === "Escape") {
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

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 outline-none"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">
            Robot Control
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Manual movement control
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Control Ready
        </div>
      </div>

      {/* Current Command */}
      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Current Command
        </p>

        <p className="mt-1 text-lg font-bold text-cyan-400">
          {direction ? commandLabel[direction] : "IDLE"}
        </p>
      </div>

      {/* Direction Controls */}
      <div className="mx-auto grid w-fit grid-cols-3 gap-2">
        {/* Empty */}
        <div />

        {/* Forward */}
        <button
          type="button"
          onMouseDown={() => sendCommand("forward")}
          onMouseUp={() => sendCommand("stop")}
          onMouseLeave={() => sendCommand("stop")}
          onTouchStart={() => sendCommand("forward")}
          onTouchEnd={() => sendCommand("stop")}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl text-white transition hover:bg-slate-700 active:bg-cyan-600"
          aria-label="Move forward"
        >
          ↑
        </button>

        <div />

        {/* Left */}
        <button
          type="button"
          onMouseDown={() => sendCommand("left")}
          onMouseUp={() => sendCommand("stop")}
          onMouseLeave={() => sendCommand("stop")}
          onTouchStart={() => sendCommand("left")}
          onTouchEnd={() => sendCommand("stop")}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl text-white transition hover:bg-slate-700 active:bg-cyan-600"
          aria-label="Turn left"
        >
          ←
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={() => sendCommand("stop")}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-red-900 bg-red-950 text-sm font-bold text-red-400 transition hover:bg-red-900"
          aria-label="Stop robot"
        >
          STOP
        </button>

        {/* Right */}
        <button
          type="button"
          onMouseDown={() => sendCommand("right")}
          onMouseUp={() => sendCommand("stop")}
          onMouseLeave={() => sendCommand("stop")}
          onTouchStart={() => sendCommand("right")}
          onTouchEnd={() => sendCommand("stop")}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl text-white transition hover:bg-slate-700 active:bg-cyan-600"
          aria-label="Turn right"
        >
          →
        </button>

        <div />

        {/* Reverse */}
        <button
          type="button"
          onMouseDown={() => sendCommand("backward")}
          onMouseUp={() => sendCommand("stop")}
          onMouseLeave={() => sendCommand("stop")}
          onTouchStart={() => sendCommand("backward")}
          onTouchEnd={() => sendCommand("stop")}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl text-white transition hover:bg-slate-700 active:bg-cyan-600"
          aria-label="Move backward"
        >
          ↓
        </button>

        <div />
      </div>

      {/* Speed */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Speed
          </span>

          <span className="text-xs font-semibold text-cyan-400">
            {speed}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={speed}
          onChange={(event) =>
            setSpeed(Number(event.target.value))
          }
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Keyboard Hint */}
      <div className="mt-5 text-center text-[11px] text-slate-600">
        Use W A S D or Arrow Keys • Space / Esc to Stop
      </div>
    </div>
  );
}