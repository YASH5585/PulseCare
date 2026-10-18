import type { DemoSession } from "./sessionStorage";

export interface SessionComparison {
  sessionA: DemoSession;
  sessionB: DemoSession;
  heartRateDifference: number;
  durationDifferenceSeconds: number;
}

export function compareSessions(
  sessionA: DemoSession,
  sessionB: DemoSession,
): SessionComparison {
  return {
    sessionA,
    sessionB,
    heartRateDifference: sessionB.heartRate - sessionA.heartRate,
    durationDifferenceSeconds:
      sessionB.durationSeconds - sessionA.durationSeconds,
  };
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} minute(s), ${seconds} second(s)`;
}

function formatDifference(value: number, unit: string): string {
  if (value > 0) {
    return `+${value} ${unit}`;
  }

  if (value < 0) {
    return `${value} ${unit}`;
  }

  return `0 ${unit}`;
}

export function exportSessionComparison(
  sessionA: DemoSession,
  sessionB: DemoSession,
): void {
  if (sessionA.id === sessionB.id) {
    throw new Error("Please select two different sessions.");
  }

  const comparison = compareSessions(sessionA, sessionB);

  const report = [
    "PULSECARE — SESSION COMPARISON REPORT",
    "======================================",
    "",
    "IMPORTANT: This report contains simulated demonstration data.",
    "It is not a medical report and must not be used for diagnosis.",
    "",
    "SESSION A",
    "---------",
    `Session ID: ${comparison.sessionA.id}`,
    `Date: ${comparison.sessionA.date}`,
    `Duration: ${formatDuration(comparison.sessionA.durationSeconds)}`,
    `Heart Rate: ${comparison.sessionA.heartRate} BPM`,
    `Data Type: ${comparison.sessionA.dataType}`,
    "",
    "SESSION B",
    "---------",
    `Session ID: ${comparison.sessionB.id}`,
    `Date: ${comparison.sessionB.date}`,
    `Duration: ${formatDuration(comparison.sessionB.durationSeconds)}`,
    `Heart Rate: ${comparison.sessionB.heartRate} BPM`,
    `Data Type: ${comparison.sessionB.dataType}`,
    "",
    "COMPARISON",
    "----------",
    `Heart-rate difference (B - A): ${formatDifference(
      comparison.heartRateDifference,
      "BPM",
    )}`,
    `Duration difference (B - A): ${formatDifference(
      comparison.durationDifferenceSeconds,
      "seconds",
    )}`,
    "",
    "DISCLAIMER",
    "----------",
    "PulseCare currently uses simulated readings.",
    "These values are not verified measurements from an ECG device.",
    "Do not use this report for medical decisions.",
  ].join("\n");

  const blob = new Blob([report], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `pulsecare-comparison-${Date.now()}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}