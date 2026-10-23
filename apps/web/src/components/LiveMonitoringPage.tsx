import ECGChart from "./ECGChart";
import StatCard from "./StatCard";
import { Clock, Heart, Wifi } from "lucide-react";
import { formatSessionDuration } from "../utils/sessionStorage";

interface LiveMonitoringPageProps {
  isDemoRunning: boolean;
  heartRate: number;
  sessionSeconds: number;
  savedSessionCount: number;
  onDemoStateChange: (running: boolean) => void;
  onHeartRateChange: (heartRate: number) => void;
  onResetSession: () => void;
}

function LiveMonitoringPage({
  isDemoRunning,
  heartRate,
  sessionSeconds,
  savedSessionCount,
  onDemoStateChange,
  onHeartRateChange,
  onResetSession,
}: LiveMonitoringPageProps) {
  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            LIVE MONITORING
          </div>
          <h2>Live Cardiac Monitoring</h2>
          <p>
            View the illustrative ECG waveform and monitor the current demo
            session. All readings are simulated, not real medical measurements.
          </p>
        </div>
        <span className="preview-badge">SIMULATED DATA</span>
      </section>

      <section className="notice-banner">
        <div className="notice-icon">
          <Heart size={21} />
        </div>
        <div className="notice-text">
          <strong>
            {isDemoRunning ? "Demo monitoring active" : "Monitoring preview"}
          </strong>
          <p>
            {isDemoRunning
              ? "The simulated waveform is running."
              : "Start the demo to view the simulated waveform."}
            {" "}This is not a medical measurement and must not be used for
            diagnosis.
          </p>
        </div>
        <span className="preview-badge">DEMO ONLY</span>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Illustrative Heart Rate"
          value={String(heartRate)}
          unit="BPM"
          icon={<Heart size={19} />}
          description="Simulated reading · Not real"
          status={isDemoRunning ? "active" : "normal"}
        />

        <StatCard
          title="Session Duration"
          value={formatSessionDuration(sessionSeconds)}
          icon={<Clock size={19} />}
          description={isDemoRunning ? "Demo running" : "Demo stopped"}
          status={isDemoRunning ? "active" : "inactive"}
        />

        <StatCard
          title="Saved Sessions"
          value={String(savedSessionCount)}
          unit="sessions"
          icon={<Wifi size={19} />}
          description="Saved simulated sessions"
          status="normal"
        />
      </section>

      <section className="monitoring-grid">
        <ECGChart
          isDemoRunning={isDemoRunning}
          onDemoStateChange={onDemoStateChange}
          onHeartRateChange={onHeartRateChange}
          sessionSeconds={sessionSeconds}
          onResetSession={onResetSession}
        />
      </section>

      <footer className="dashboard-footer">
        <span>PulseCare · Cardiac Health Platform</span>
        <span>Educational prototype · Not for diagnosis</span>
      </footer>
    </div>
  );
}

export default LiveMonitoringPage;
