import { useEffect, useState } from 'react';
import { Eye, EyeOff, HelpCircle, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
  ATTENTIVE: { label: 'Attentive', icon: Eye, className: 'monitoring-badge-attentive' },
  NOT_ATTENTIVE: { label: 'Not Attentive', icon: EyeOff, className: 'monitoring-badge-inattentive' },
  UNKNOWN: { label: 'Checking...', icon: HelpCircle, className: 'monitoring-badge-unknown' },
};

/**
 * Live-only status view for the teacher — updates as `live:monitoring-status`
 * events arrive for each student. This is ephemeral (resets on refresh);
 * persisted history, phone-alert counts over time, and the end-of-class
 * report are built in Phase 10.
 */
export default function MonitoringStatusPanel({ socket, liveClassId }) {
  const [statusByStudent, setStatusByStudent] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload) => {
      if (payload.liveClassId !== liveClassId) return;
      setStatusByStudent((prev) => ({ ...prev, [payload.studentId]: payload }));
    };

    socket.on('live:monitoring-status', handleUpdate);
    return () => socket.off('live:monitoring-status', handleUpdate);
  }, [socket, liveClassId]);

  const entries = Object.values(statusByStudent);

  return (
    <div className="liveclass-side-panel">
      <h3 className="liveclass-side-title">Monitoring Status</h3>
      {entries.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Waiting for student monitoring data...
        </p>
      ) : (
        entries.map((s) => {
          const config = STATUS_CONFIG[s.status] || STATUS_CONFIG.UNKNOWN;
          const Icon = config.icon;
          return (
            <div key={s.studentId} className="monitoring-panel-row">
              <span className="monitoring-panel-name">{s.studentName}</span>
              <span className={`monitoring-badge ${config.className}`}>
                <Icon size={12} /> {config.label}
              </span>
              {s.phoneDetected && (
                <span className="monitoring-flag monitoring-flag-alert" title="Mobile Phone Detected!">
                  <AlertTriangle size={12} />
                </span>
              )}
            </div>
          );
        })
      )}
      <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.75rem' }}>
        Live status only — history and reports are added in Phase 10.
      </p>
    </div>
  );
}
