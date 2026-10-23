import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ECGPoint {
  time: number;
  value: number;
}

interface ECGChartProps {
  isDemoRunning: boolean;
  onDemoStateChange: (running: boolean) => void;
  onHeartRateChange: (heartRate: number) => void;
  sessionSeconds: number;
  onResetSession: () => void;
}

// SIMULATED DATA ONLY â€” not actual ECG sensor readings.
function generateECGValue(index: number): number {
  const position = index % 50;
  const baseline = Math.sin(index * 0.2) * 0.025;

  if (position === 12) return 0.9 + baseline;

  if (position === 11 || position === 13) {
    return -0.25 + baseline;
  }

  return Math.sin(index * 0.8) * 0.025 + baseline;
}

function createInitialData(): ECGPoint[] {
  return Array.from({ length: 100 }, (_, index) => ({
    time: index,
    value: generateECGValue(index),
  }));
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function ECGChart({
  isDemoRunning,
  onDemoStateChange,
  onHeartRateChange,
  sessionSeconds,
  onResetSession,
}: ECGChartProps) {
  const [ecgData, setEcgData] = useState<ECGPoint[]>(createInitialData);
  const [heartRate, setHeartRate] = useState(72);
  // Animate the simulated waveform.
  useEffect(() => {
    if (!isDemoRunning) return;

    const interval = window.setInterval(() => {
      const nextHeartRate = 68 + Math.floor(Math.random() * 13);
      setHeartRate(nextHeartRate);
      onHeartRateChange(nextHeartRate);
      setEcgData((previousData) => {
        const lastTime =
          previousData.length > 0
            ? previousData[previousData.length - 1].time
            : 0;

        const nextTime = lastTime + 1;

        return [
          ...previousData.slice(1),
          {
            time: nextTime,
            value: generateECGValue(nextTime),
          },
        ];
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isDemoRunning, onHeartRateChange]);

  function handleToggleDemo() {
    if (isDemoRunning) {
      onDemoStateChange(false);
      return;
    }

    setEcgData(createInitialData());
    onDemoStateChange(true);
  }

  function handleResetSession() {
    onResetSession();
    setEcgData(createInitialData());
  }

  return (
    <article className="panel ecg-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title-row">
            <h3>ECG Overview</h3>
            <span className="demo-tag">SIMULATED</span>
          </div>

          <p>
            Illustrative waveform Â· Not a medical measurement
          </p>
        </div>

        <button
          className="outline-button"
          type="button"
          onClick={handleToggleDemo}
        >
          {isDemoRunning ? "Stop Demo" : "Start Demo"}
        </button>
      </div>

      <div className="ecg-summary">
        <div>
          <span className="small-label">
            Illustrative heart rate
          </span>

          <div className="ecg-bpm">
            {heartRate} <span>BPM</span>
          </div>
        </div>

        <div className="signal-status">
          {isDemoRunning ? "Demo Running" : "Demo Stopped"}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={isDemoRunning ? ecgData : []}
            margin={{
              top: 12,
              right: 8,
              left: -24,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#e8eef2"
              strokeDasharray="3 4"
            />

            <XAxis
              dataKey="time"
              tick={false}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[-0.4, 1.1]}
              tick={false}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              formatter={(value) => [
                Number(value).toFixed(3),
                "Illustrative amplitude",
              ]}
              labelFormatter={() => "Simulated sample"}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#159b91"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <span>
          <span className="legend-line" />
          Illustrative ECG waveform
        </span>

        <span>Simulated signal only</span>
      </div>

      <div className="session-controls">
        <div className="session-info">
          <span className="small-label">Session duration</span>
          <strong>{formatTime(sessionSeconds)}</strong>
        </div>

        <button
          className="outline-button"
          type="button"
          onClick={handleResetSession}
        >
          Reset Session
        </button>
      </div>
    </article>
  );
}

export default ECGChart;


