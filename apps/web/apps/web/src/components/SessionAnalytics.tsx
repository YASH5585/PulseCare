import {
  Activity,
  Clock,
  HeartPulse,
  TrendingUp,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DemoSession } from "../utils/sessionStorage";
import { formatSessionDuration } from "../utils/sessionStorage";

interface SessionAnalyticsProps {
  sessions: DemoSession[];
}

export default function SessionAnalytics({
  sessions,
}: SessionAnalyticsProps) {
  const totalSessions = sessions.length;

  const totalDuration = sessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  const averageDuration =
    totalSessions > 0 ? totalDuration / totalSessions : 0;

  const chartData = [...sessions]
    .reverse()
    .map((session, index) => ({
      name: `Session ${index + 1}`,
      duration: session.duration,
    }));

  return (
    <section className="panel analytics-panel">
      <div className="section-heading">
        <div>
          <h3>Session Analytics</h3>
          <p>Summary of your recorded demo sessions</p>
        </div>

        <span className="status-badge">
          <Activity size={14} />
          Demo data
        </span>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card">
          <div className="analytics-card-top">
            <span>Total Sessions</span>
            <span className="analytics-icon">
              <HeartPulse size={18} />
            </span>
          </div>

          <h2>{totalSessions}</h2>
          <p>Saved sessions</p>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-top">
            <span>Total Duration</span>
            <span className="analytics-icon">
              <Clock size={18} />
            </span>
          </div>

          <h2>{formatSessionDuration(totalDuration)}</h2>
          <p>Combined session time</p>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-top">
            <span>Average Duration</span>
            <span className="analytics-icon">
              <TrendingUp size={18} />
            </span>
          </div>

          <h2>{formatSessionDuration(averageDuration)}</h2>
          <p>Per saved session</p>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-top">
            <span>Longest Session</span>
            <span className="analytics-icon">
              <Activity size={18} />
            </span>
          </div>

          <h2>
            {formatSessionDuration(
              sessions.reduce(
                (longest, session) =>
                  Math.max(longest, session.duration),
                0
              )
            )}
          </h2>

          <p>Maximum duration</p>
        </article>
      </div>

      <div className="analytics-chart-section">
        <div className="analytics-chart-heading">
          <h4>Session Duration Trend</h4>
          <p>Duration of each saved session</p>
        </div>

        {chartData.length > 0 ? (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis
                  allowDecimals={false}
                  label={{
                    value: "Seconds",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `${value} seconds`,
                    "Duration",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="analytics-empty">
            <Activity size={32} />
            <p>No session data available yet</p>
            <span>
              Start and stop a demo session to see your analytics.
            </span>
          </div>
        )}
      </div>

      <div className="analytics-disclaimer">
        Analytics summarize saved demo-session durations only. They do
        not represent clinical measurements or diagnostic results.
      </div>
    </section>
  );
}