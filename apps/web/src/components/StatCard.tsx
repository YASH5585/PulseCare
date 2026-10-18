import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  description: string;
  status?: "normal" | "active" | "inactive";
}

function StatCard({
  title,
  value,
  unit,
  icon,
  description,
  status = "normal",
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-heading">
        <span>{title}</span>

        <div className="stat-icon">
          {icon}
        </div>
      </div>

      <div className="stat-value">
        {value}
        {unit && <span> {unit}</span>}
      </div>

      <div className="stat-footer">
        <span
          className={`neutral-indicator status-${status}`}
        >
          {description}
        </span>
      </div>
    </article>
  );
}

export default StatCard;