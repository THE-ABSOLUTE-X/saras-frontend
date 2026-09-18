"use client";

interface Telemetry {
  temperature: number | null;
  humidity: number | null;
  gasLevel: number | null;
  flameDetected: boolean | null;
  ultrasonicDistance: number | null;
  batteryLevel: number | null;
}

interface SensorStatusProps {
  telemetry: Telemetry;
}

interface Sensor {
  name: string;
  value: string;
  status: "normal" | "warning" | "danger";
}

export default function SensorStatus({
  telemetry,
}: SensorStatusProps) {
  const sensors: Sensor[] = [
    {
      name: "Temperature",
      value:
        telemetry.temperature !== null
          ? `${telemetry.temperature.toFixed(1)} °C`
          : "--",
      status: "normal",
    },
    {
      name: "Distance",
      value:
        telemetry.ultrasonicDistance !== null
          ? `${telemetry.ultrasonicDistance.toFixed(1)} cm`
          : "--",
      status: "normal",
    },
    {
      name: "Gas",
      value:
        telemetry.gasLevel !== null
          ? `${telemetry.gasLevel}`
          : "--",
      status: "normal",
    },
    {
      name: "Flame",
      value:
        telemetry.flameDetected === null
          ? "--"
          : telemetry.flameDetected
            ? "Detected"
            : "None",
      status:
        telemetry.flameDetected === true
          ? "danger"
          : "normal",
    },
    {
      name: "GPS",
      value: "Backend telemetry",
      status: "normal",
    },
    {
      name: "Battery",
      value:
        telemetry.batteryLevel !== null
          ? `${telemetry.batteryLevel.toFixed(0)}%`
          : "--",
      status:
        telemetry.batteryLevel !== null &&
        telemetry.batteryLevel < 20
          ? "warning"
          : "normal",
    },
  ];

  function getStatusStyle(status: Sensor["status"]) {
    switch (status) {
      case "danger":
        return {
          dot: "bg-red-500",
          text: "text-red-400",
        };

      case "warning":
        return {
          dot: "bg-yellow-400",
          text: "text-yellow-400",
        };

      default:
        return {
          dot: "bg-green-400",
          text: "text-green-400",
        };
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">
            Sensor Status
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Live rover sensor readings
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
        {sensors.map((sensor) => {
          const style = getStatusStyle(sensor.status);

          return (
            <div
              key={sensor.name}
              className="bg-slate-900 px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {sensor.name}
                </span>

                <span
                  className={`h-2 w-2 rounded-full ${style.dot}`}
                />
              </div>

              <div className="mt-2 flex items-end justify-between">
                <span className="text-lg font-semibold text-white">
                  {sensor.value}
                </span>

                <span
                  className={`text-[10px] uppercase tracking-wide ${style.text}`}
                >
                  {sensor.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
