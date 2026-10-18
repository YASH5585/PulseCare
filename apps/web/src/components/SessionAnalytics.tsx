import {
  Activity,
  Clock,
  Heart,
  TrendingUp,
  Timer,
  BarChart3,
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

  const totalDurationSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );

  const averageHeartRate =
    totalSessions > 0
      ? Math.round(
          sessions.reduce(
            (total, session) => total + session.heartRate,
            0,
          ) / totalSessions,
        )
      : 0;

  const averageDurationSeconds =
    totalSessions > 0
      ? Math.round(totalDurationSeconds / totalSessions)
      : 0;

  const longestSessionSeconds = sessions.reduce(
    (longest, session) =>
      Math.max(longest, session.durationSeconds),
    0,
  );

  // Display sessions in chronological order on the chart.
  const chartData = [...sessions]
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime(),
    )
    .map((session, index) => ({
      name: `Session ${index + 1}`,
      date: new Date(session.date).toLocaleDateString(),
      duration: Math.max(0, session.durationSeconds),
      heartRate: session.heartRate,
    }));

  const analytics = [
    {
      title: "Total Sessions",
      value: String(totalSessions),
      description: "Saved demo sessions",
      icon: Activity,
    },
    {
      title: "Total Recording Time",
      value: formatSessionDuration(totalDurationSeconds),
      description: "Combined recording duration",
      icon: Clock,
    },
    {
      title: "Average Heart Rate",
      value:
        totalSessions > 0
          ? `${averageHeartRate} BPM`
          : "--",
      description: "Average simulated BPM",
      icon: Heart,
    },
    {
      title: "Average Session",
      value: formatSessionDuration(averageDurationSeconds),
      description: "Average recording duration",
      icon: Timer,
    },
    {
      title: "Longest Session",
      value: formatSessionDuration(longestSessionSeconds),
      description: "Longest saved recording",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="session-analytics">
      <div className="section-heading">
        <div>
          <h2>Session Analytics</h2>
          <p>
            Review trends across your saved ECG demonstration
            sessions.
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        {analytics.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="analytics-card"
              key={item.title}
            >
              <div className="analytics-card-header">
                <span>{item.title}</span>

                <span className="analytics-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>

              <div className="analytics-value">
                {item.value}
              </div>

              <p className="analytics-description">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>

      <article className="analytics-chart-card">
        <div className="analytics-chart-header">
          <div className="analytics-chart-title">
            <span className="analytics-icon">
              <BarChart3 size={20} aria-hidden="true" />
            </span>

            <div>
              <h3>Session Duration Trend</h3>
              <p>
                Compare recording durations across saved sessions.
              </p>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="analytics-empty-state">
            <span className="analytics-empty-icon">
              <Activity size={28} aria-hidden="true" />
            </span>

            <h4>No session data yet</h4>

            <p>
              Complete and save a demonstration session to
              see your analytics and duration trends here.
            </p>
          </div>
        ) : (
          <div
            className="analytics-chart"
            role="img"
            aria-label="Line chart showing the duration of each saved demonstration session"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 12,
                  right: 20,
                  left: 8,
                  bottom: 8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value: number) =>
                    formatSessionDuration(value)
                  }
                  label={{
                    value: "Duration (MM:SS)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, textAnchor: "middle" },
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    formatSessionDuration(Number(value)),
                    "Duration",
                  ]}
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload;

                    return point
                      ? `${String(label)} • ${point.date}`
                      : String(label);
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="duration"
                  name="Duration"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#0d9488",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <div className="analytics-disclaimer">
        <Heart size={18} aria-hidden="true" />

        <p>
          <strong>Demonstration data:</strong> All sessions
          and heart-rate values displayed here are simulated.
          They have not been verified using physical ECG
          hardware and must not be used for medical diagnosis
          or treatment decisions.
        </p>
      </div>
    </section>
  );
}