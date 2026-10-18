import {
  Activity,
  Clock,
  Heart,
  TrendingUp,
} from "lucide-react";

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

  const analytics = [
    {
      title: "Total Sessions",
      value: String(totalSessions),
      description: "Saved ECG demo sessions",
      icon: Activity,
    },
    {
      title: "Total Recording Time",
      value: formatSessionDuration(totalDurationSeconds),
      description: "Combined session duration",
      icon: Clock,
    },
    {
      title: "Average Heart Rate",
      value:
        totalSessions > 0
          ? `${averageHeartRate} BPM`
          : "--",
      description: "Average across saved sessions",
      icon: Heart,
    },
    {
      title: "Average Session",
      value: formatSessionDuration(averageDurationSeconds),
      description: `Longest: ${formatSessionDuration(
        longestSessionSeconds,
      )}`,
      icon: TrendingUp,
    },
  ];

  return (
    <section className="session-analytics">
      <div className="section-heading">
        <div>
          <h2>Session Analytics</h2>
          <p>Summary of your saved ECG demo sessions.</p>
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
    </section>
  );
}