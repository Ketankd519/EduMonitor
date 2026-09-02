import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLiveClassById, endLiveClass } from '../../api/liveClassApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useFrameCapture } from '../../hooks/useFrameCapture';
import VideoTile from '../../components/liveclass/VideoTile';
import ControlsBar from '../../components/liveclass/ControlsBar';
import ParticipantList from '../../components/liveclass/ParticipantList';
import MonitoringOverlay from '../../components/monitoring/MonitoringOverlay';
import MonitoringStatusPanel from '../../components/monitoring/MonitoringStatusPanel';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import '../../styles/liveclass.css';

export default function LiveClassRoom() {
  const { liveClassId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    getLiveClassById(liveClassId)
      .then((res) => setLiveClass(res.data.data.liveClass))
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load this live class.'))
      .finally(() => setLoading(false));
  }, [liveClassId]);

  const isTeacher = liveClass && liveClass.class.teacher === user.id;
  const callEnabled = !loading && !loadError && !!liveClass && liveClass.status === 'active';

  const {
    localStream,
    remoteStreams,
    participants,
    micOn,
    camOn,
    screenSharing,
    mediaError,
    connecting,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  } = useWebRTC({ socket, liveClassId, enabled: callEnabled });

  // Students' own frames are periodically analyzed for face presence /
  // attention / phone use. Teachers are never monitored (§19/§27).
  const { latestStatus: monitoringStatus, serviceError: monitoringServiceError } = useFrameCapture({
    stream: localStream,
    liveClassId,
    enabled: callEnabled && user.role === 'student' && !!localStream,
  });

  const goBack = () => {
    navigate(user.role === 'teacher' ? `/teacher/classes/${liveClass.class._id}` : `/student/classes/${liveClass.class._id}`);
  };

  const handleLeave = () => {
    goBack();
  };

  const handleEndClass = async () => {
    if (!window.confirm('End this live class for everyone?')) return;
    setEnding(true);
    try {
      await endLiveClass(liveClassId);
      goBack();
    } catch (err) {
      setEnding(false);
    }
  };

  if (loading) return <Loader label="Loading live class..." />;
  if (loadError) return <EmptyState message={loadError} />;
  if (!socket) return <Loader label="Connecting..." />;

  if (mediaError) {
    return (
      <div className="liveclass-room">
        <EmptyState message={mediaError} />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} onClick={goBack}>
            Back to Classroom
          </button>
        </div>
      </div>
    );
  }

  const remoteParticipantEntries = Object.entries(participants);

  return (
    <div className="liveclass-room">
      <div className="liveclass-header">
        <div>
          <div className="liveclass-header-title">{liveClass.class.subjectTitle}</div>
          <div className="liveclass-header-code">{liveClass.class.subjectCode} &middot; Section {liveClass.class.section}</div>
        </div>
        <span className="liveclass-live-badge">● LIVE</span>
      </div>

      {user.role === 'student' && (
        <div className="monitoring-active-banner">
          AI-based attention monitoring is active during this live class. Only your own presence/attention
          signals are analyzed — never emotional state, and no video is stored.
        </div>
      )}

      <div className="liveclass-body">
        <div className="liveclass-main">
          {connecting ? (
            <Loader label="Connecting to the call..." />
          ) : (
            <div className="liveclass-video-grid">
              <VideoTile
                stream={localStream}
                name={user.fullName}
                isLocal
                camOn={camOn}
                micOn={micOn}
                overlay={
                  user.role === 'student' ? (
                    <MonitoringOverlay latestStatus={monitoringStatus} serviceError={monitoringServiceError} />
                  ) : null
                }
              />
              {remoteParticipantEntries.map(([socketId, info]) => (
                <VideoTile
                  key={socketId}
                  stream={remoteStreams[socketId]}
                  name={info.fullName}
                  camOn={info.camOn !== false}
                  micOn={info.micOn !== false}
                />
              ))}
            </div>
          )}
        </div>

        <div className="liveclass-sidebar">
          <ParticipantList
            participants={participants}
            selfName={user.fullName}
            selfMicOn={micOn}
            selfCamOn={camOn}
          />
          {isTeacher && <MonitoringStatusPanel socket={socket} liveClassId={liveClassId} />}
        </div>
      </div>

      <ControlsBar
        micOn={micOn}
        camOn={camOn}
        screenSharing={screenSharing}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleScreenShare={toggleScreenShare}
        onLeave={handleLeave}
        onEndClass={handleEndClass}
        isTeacher={isTeacher}
      />
      {ending && <div className="liveclass-ending-overlay">Ending class...</div>}
    </div>
  );
}
