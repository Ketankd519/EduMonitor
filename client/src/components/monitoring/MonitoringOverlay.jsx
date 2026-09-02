import { AlertTriangle, Eye, EyeOff, HelpCircle } from 'lucide-react';

const STATUS_CONFIG = {
  ATTENTIVE: { label: 'Attentive', icon: Eye, className: 'monitoring-badge-attentive' },
  NOT_ATTENTIVE: { label: 'Not Attentive', icon: EyeOff, className: 'monitoring-badge-inattentive' },
  UNKNOWN: { label: 'Checking...', icon: HelpCircle, className: 'monitoring-badge-unknown' },
};

/**
 * Shown only on the student's own video tile during a live class. Displays
 * the measurable signals described in §25/§28 — face presence and a
 * screen-facing/attention estimate — never an emotional-state claim.
 */
export default function MonitoringOverlay({ latestStatus, serviceError }) {
  if (serviceError) {
    return (
      <div className="monitoring-overlay monitoring-overlay-error">
        <AlertTriangle size={13} /> {serviceError}
      </div>
    );
  }

  if (!latestStatus) {
    return <div className="monitoring-overlay monitoring-overlay-pending">Monitoring starting...</div>;
  }

  const config = STATUS_CONFIG[latestStatus.status] || STATUS_CONFIG.UNKNOWN;
  const Icon = config.icon;

  return (
    <div className="monitoring-overlay">
      <span className={`monitoring-badge ${config.className}`}>
        <Icon size={13} /> {config.label}
      </span>
      {!latestStatus.faceDetected && <span className="monitoring-flag">Face not detected</span>}
      {latestStatus.phoneDetected && (
        <span className="monitoring-flag monitoring-flag-alert">
          <AlertTriangle size={12} /> Mobile Phone Detected!
        </span>
      )}
      {!latestStatus.phoneDetectionAvailable && (
        <span className="monitoring-flag monitoring-flag-muted">Phone detection unavailable</span>
      )}
    </div>
  );
}
