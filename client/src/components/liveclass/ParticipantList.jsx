import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function ParticipantList({ participants, selfName, selfMicOn, selfCamOn }) {
  const list = Object.values(participants);

  return (
    <div className="liveclass-side-panel">
      <h3 className="liveclass-side-title">Participants ({list.length + 1})</h3>

      <div className="liveclass-participant-row">
        <span>{selfName} (You)</span>
        <span className="liveclass-participant-icons">
          {selfMicOn ? <Mic size={14} /> : <MicOff size={14} />}
          {selfCamOn ? <Video size={14} /> : <VideoOff size={14} />}
        </span>
      </div>

      {list.map((p) => (
        <div className="liveclass-participant-row" key={p.socketId}>
          <span>
            {p.fullName} {p.role === 'teacher' && <span className="liveclass-teacher-tag">Teacher</span>}
          </span>
          <span className="liveclass-participant-icons">
            {p.micOn !== false ? <Mic size={14} /> : <MicOff size={14} />}
            {p.camOn !== false ? <Video size={14} /> : <VideoOff size={14} />}
          </span>
        </div>
      ))}

      {list.length === 0 && (
        <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No one else has joined yet.</p>
      )}
    </div>
  );
}
