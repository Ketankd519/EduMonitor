import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import API from '../../services/api';
import axios from 'axios';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  AlertCircle,
  Radio,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock
} from 'lucide-react';
import './ProfilePage.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Derive initials from full name according to rules:
// - first letter of first name
// - first letter of last name
// - uppercase
// - if only one name, show one letter
// - handle undefined/empty names safely
// Examples:
// Ketan Dhanvijay -> KD
// Rahul Sharma -> RS
// Priya -> P
// Amit Kumar Patil -> AP
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

// Format seconds into HH:MM:SS (e.g. 00:12:35, 00:03:20)
export const formatHHMMSS = (totalSeconds) => {
  const secs = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const LiveClassRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const isTeacher = user?.role === 'TEACHER';

  // Session metadata
  const [liveSession, setLiveSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteMediaStates, setRemoteMediaStates] = useState({}); // socketId -> { micActive, videoActive }

  // Media controls
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // Ending status
  const [isEnding, setIsEnding] = useState(false);

  // Student AI monitoring status (temporal metrics kept for reports and display)
  const [aiStatus, setAiStatus] = useState({
    faceDetected: true,
    lookingAway: false,
    attentionState: 'ATTENTIVE',
    phoneDetected: false,
    attentionScore: 100,
    attentiveSec: 0,
    inattentiveSec: 0,
    confidence: 1.0
  });

  // Video, canvas, and connection refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const offscreenCanvasRef = useRef(document.createElement('canvas'));
  const peerConnections = useRef({});
  const monitoringIntervalRef = useRef(null);
  const isProcessingFrameRef = useRef(false);
  const isInitializingRef = useRef(false);

  /**
   * Unified cleanup function: stops all media tracks, detaches video srcObject,
   * closes all peer connections, halts monitoring, and clears session state.
   */
  const cleanupLiveSession = useCallback(() => {
    isInitializingRef.current = false;
    // 1. Stop AI monitoring interval & active flag
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    isProcessingFrameRef.current = false;

    // 2. Stop all local tracks (camera and microphone) to turn off browser media indicators
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping local tracks:', e);
      }
      localStreamRef.current = null;
    }

    // 3. Clear local video element srcObject to immediately release hardware handles
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // 4. Close and clean up all WebRTC peer connections
    if (peerConnections.current) {
      Object.entries(peerConnections.current).forEach(([socketId, pc]) => {
        try {
          pc.ontrack = null;
          pc.onicecandidate = null;
          pc.onconnectionstatechange = null;
          pc.close();
        } catch (e) {
          console.warn('Error closing pc for', socketId, e);
        }
      });
      peerConnections.current = {};
    }

    // 5. Reset React media state
    setLocalStream(null);
    setRemoteStreams({});
    setParticipants([]);
    setRemoteMediaStates({});
  }, []);

  // Cleanup on unmount or classId change
  useEffect(() => {
    let isMounted = true;

    if (socket) {
      initializeRoom(isMounted);
    }

    return () => {
      isMounted = false;
      cleanupLiveSession();

      if (socket) {
        socket.emit('leave-room', { roomId: classId });
        socket.off('all-participants');
        socket.off('user-joined');
        socket.off('user-media-toggle');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('user-left');
        socket.off('session-ended');
      }
    };
  }, [classId, socket]);

  // Bind camera stream to the local video element with guaranteed local mute
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
    }
  }, [localStream]);

  // Start AI monitoring for students
  useEffect(() => {
    if (!isTeacher && liveSession && videoActive) {
      startMonitoringPipeline();
    } else {
      stopMonitoringPipeline();
    }

    return () => stopMonitoringPipeline();
  }, [liveSession, videoActive, isTeacher]);

  const initializeRoom = async (isMounted = true) => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      let res;

      if (isTeacher) {
        res = await API.post('/live-classes/start', { classId });
      } else {
        res = await API.get(`/live-classes/active/${classId}`);
      }

      if (!isMounted) return;

      const session = res.data.liveSession;

      // Session already ended check: do not reconnect students to stale/ended sessions
      if (!session || session.status !== 'LIVE') {
        alert('This live class session has ended or is no longer active.');
        cleanupLiveSession();
        return navigate(`/classroom/${classId}`);
      }

      setLiveSession(session);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (mediaErr) {
        console.warn('Initial getUserMedia with audio+video failed, trying individual tracks', mediaErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setMicActive(false);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setVideoActive(false);
        }
      }

      if (!isMounted) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Verify actual initial states
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      const initialMicOn = audioTrack ? audioTrack.enabled : false;
      const initialVideoOn = videoTrack ? videoTrack.enabled : false;

      setMicActive(initialMicOn);
      setVideoActive(initialVideoOn);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
      }

      if (socket) {
        socket.emit('join-room', {
          roomId: classId,
          user: {
            ...user,
            micActive: initialMicOn,
            videoActive: initialVideoOn
          }
        });
        setupSocketListeners();
      }
    } catch (err) {
      console.error('Error initializing live classroom:', err);
      alert('Camera and microphone permission required to join the live session.');
      navigate(`/classroom/${classId}`);
    } finally {
      isInitializingRef.current = false;
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    // Prevent duplicate event listener stacking
    socket.off('all-participants');
    socket.off('user-joined');
    socket.off('user-media-toggle');
    socket.off('webrtc-offer');
    socket.off('webrtc-answer');
    socket.off('webrtc-ice-candidate');
    socket.off('user-left');
    socket.off('session-ended');

    socket.on('all-participants', (existingUsers) => {
      setParticipants(existingUsers);

      const initialMediaStates = {};
      existingUsers.forEach((peerUser) => {
        initialMediaStates[peerUser.socketId] = {
          micActive: peerUser.micActive !== undefined ? peerUser.micActive : true,
          videoActive: peerUser.videoActive !== undefined ? peerUser.videoActive : true
        };
        createPeerOffer(peerUser.socketId, peerUser);
      });
      setRemoteMediaStates((prev) => ({ ...prev, ...initialMediaStates }));
    });

    socket.on('user-joined', (peerUser) => {
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== peerUser.socketId);
        return [...filtered, peerUser];
      });

      setRemoteMediaStates((prev) => ({
        ...prev,
        [peerUser.socketId]: {
          micActive: peerUser.micActive !== undefined ? peerUser.micActive : true,
          videoActive: peerUser.videoActive !== undefined ? peerUser.videoActive : true
        }
      }));
    });

    socket.on('user-media-toggle', ({ socketId, micActive: theirMic, videoActive: theirVideo }) => {
      setRemoteMediaStates((prev) => ({
        ...prev,
        [socketId]: {
          micActive: theirMic !== undefined ? theirMic : prev[socketId]?.micActive ?? true,
          videoActive: theirVideo !== undefined ? theirVideo : prev[socketId]?.videoActive ?? true
        }
      }));
    });

    socket.on('webrtc-offer', async ({ callerSocketId, offer, callerUser }) => {
      const pc = createPeerConnection(callerSocketId, callerUser);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        targetSocketId: callerSocketId,
        answer
      });
    });

    socket.on('webrtc-answer', async ({ responderSocketId, answer }) => {
      const pc = peerConnections.current[responderSocketId];

      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnections.current[senderSocketId];

      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate', e);
        }
      }
    });

    socket.on('user-left', ({ socketId }) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }

      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });

      setRemoteMediaStates((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });

      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // When teacher ends class: all students automatically clean up and exit without manual refresh
    socket.on('session-ended', ({ message }) => {
      // The teacher who ended the class already confirmed; do not show them the student alert
      if (isTeacher) return;

      cleanupLiveSession();
      alert(message || 'The teacher has ended this live class session.');
      navigate(`/classroom/${classId}`);
    });
  };

  const createPeerConnection = (targetSocketId, peerUser) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: {
          stream: event.streams[0],
          user: peerUser
        }
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    return pc;
  };

  const createPeerOffer = async (targetSocketId, peerUser) => {
    const pc = createPeerConnection(targetSocketId, peerUser);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc-offer', {
      targetSocketId,
      offer,
      callerUser: user
    });
  };

  // Student AI monitoring pipeline (sequential with concurrency guard)
  const startMonitoringPipeline = () => {
    stopMonitoringPipeline();

    monitoringIntervalRef.current = setInterval(async () => {
      if (!localVideoRef.current || !liveSession) return;

      const video = localVideoRef.current;
      if (video.readyState !== 4) return;

      // Prevent overlapping in-flight requests
      if (isProcessingFrameRef.current) return;
      isProcessingFrameRef.current = true;

      const canvas = offscreenCanvasRef.current;
      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameBase64 = canvas.toDataURL('image/jpeg', 0.6);

      try {
        const aiRes = await axios.post('http://localhost:8000/analyze-frame', {
          session_id: liveSession._id,
          student_id: user._id,
          image_base64: frameBase64
        });

        const data = aiRes.data;

        const metrics = data.metrics || {
          attention_score: 100,
          attentive_seconds: 0,
          inattentive_seconds: 0
        };

        setAiStatus({
          faceDetected: data.face_detected,
          lookingAway: data.looking_away,
          attentionState: data.attention_state,
          phoneDetected: data.phone_detected,
          attentionScore: metrics.attention_score,
          attentiveSec: metrics.attentive_seconds,
          inattentiveSec: metrics.inattentive_seconds,
          confidence: data.confidence
        });

        let eventType = 'FACE_DETECTED';

        if (data.phone_detected) {
          eventType = 'PHONE_DETECTED';
        } else if (!data.face_detected) {
          eventType = 'FACE_NOT_DETECTED';
        } else if (data.looking_away) {
          eventType = 'LOOKING_AWAY';
        }

        await API.post('/monitoring/event', {
          liveClassId: liveSession._id,
          eventType,
          confidence: data.confidence,
          metrics
        });
      } catch (err) {
        console.error('[AI Monitoring] Error processing frame:', err.message);
      } finally {
        isProcessingFrameRef.current = false;
      }
    }, 1500);
  };

  const stopMonitoringPipeline = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    isProcessingFrameRef.current = false;
  };

  // Media controls: Toggle microphone
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];

    if (audioTrack) {
      const nextMicState = !audioTrack.enabled;
      audioTrack.enabled = nextMicState;
      setMicActive(nextMicState);

      // Synchronize audio across all active WebRTC senders
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
        if (sender && sender.track) {
          sender.track.enabled = nextMicState;
        }
      });

      // Broadcast audio state to room peers
      if (socket) {
        socket.emit('toggle-media', {
          roomId: classId,
          micActive: nextMicState,
          videoActive
        });
      }
    }
  };

  // Media controls: Toggle camera
  const toggleVideo = async () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];

    if (videoTrack) {
      const nextVideoState = !videoTrack.enabled;
      videoTrack.enabled = nextVideoState;
      setVideoActive(nextVideoState);

      // Synchronize video across all active WebRTC senders
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && sender.track) {
          sender.track.enabled = nextVideoState;
        }
      });

      // Broadcast video state to room peers
      if (socket) {
        socket.emit('toggle-media', {
          roomId: classId,
          micActive,
          videoActive: nextVideoState
        });
      }

      if (!nextVideoState && !isTeacher && liveSession) {
        try {
          await API.post('/monitoring/event', {
            liveClassId: liveSession._id,
            eventType: 'CAMERA_OFF',
            confidence: 1.0
          });
        } catch (e) {
          console.error('Failed to log camera off', e);
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');

          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          revertToCameraTrack();
        };

        setScreenSharing(true);
      } else {
        revertToCameraTrack();
      }
    } catch (err) {
      console.error('Error toggling screen share', err);
    }
  };

  const revertToCameraTrack = () => {
    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setScreenSharing(false);
  };

  // Leave / End session handler
  const handleSessionAction = async () => {
    if (isTeacher) {
      if (isEnding) return;

      // Teacher End Session flow - exactly ONE confirmation dialog
      const confirmEnd = window.confirm('Are you sure you want to end this live class session for all participants?');
      if (!confirmEnd) return;
      setIsEnding(true);

      // 1. Mark session ENDED in database FIRST so database status is updated immediately
      try {
        const endId = liveSession?._id || classId;
        await API.post(`/live-classes/end/${endId}`);
      } catch (err) {
        console.error('Failed to end live class session in DB:', err);
      }

      // 2. Emit end-session via socket so all students immediately exit
      if (socket) {
        socket.emit('end-session', { roomId: classId });
      }

      // 3. Complete media and connection cleanup
      cleanupLiveSession();

      // 4. Navigate back to classroom
      navigate(`/classroom/${classId}`);
      setIsEnding(false);
    } else {
      // Student Leave Session flow
      cleanupLiveSession();

      if (socket) {
        socket.emit('leave-room', { roomId: classId });
      }

      navigate(`/classroom/${classId}`);
    }
  };

  const attentionStatusIsGood = aiStatus.attentionState === 'ATTENTIVE' && !aiStatus.lookingAway;
  const displayStatus = aiStatus.lookingAway
    ? 'Looking Away'
    : aiStatus.attentionState === 'ATTENTIVE'
      ? 'Attentive'
      : aiStatus.attentionState.replace('_', ' ');

  const videoGridColumns =
    Object.keys(remoteStreams).length === 0
      ? '1fr'
      : 'repeat(auto-fit, minmax(320px, 1fr))';

  // Teacher / Host identification:
  // For local participant: isTeacher indicates host
  const localDisplayName = isTeacher ? `${user?.name || 'Teacher'} [HOST]` : (user?.name || 'Student');
  const hostTeacherId = liveSession?.hostTeacher?._id || liveSession?.hostTeacher;

  return (
    <div className="live-classroom">
      {/* Top header */}
      <header className="live-classroom-header">
        <div className="live-classroom-brand">
          <div className="live-classroom-live-badge">
            <Radio size={14} className="animate-pulse" />
            <span>LIVE</span>
          </div>

          <span className="live-classroom-title">
            {liveSession?.title || 'Virtual Classroom'}
          </span>
        </div>

        {/* Student attention section: ONLY Status, Attentive Time, Away Time (NO Attention Percentage) */}
        {!isTeacher && (
          <div className="live-classroom-attention">
            <div className="live-classroom-attention-status">
              <ShieldCheck
                size={16}
                className={`attention-status-icon ${
                  attentionStatusIsGood
                    ? 'attention-status-good'
                    : 'attention-status-warning'
                }`}
              />

              <span>
                Status: <strong>{displayStatus}</strong>
              </span>
            </div>

            <span className="live-classroom-attention-divider">|</span>

            <div className="live-classroom-counters">
              <Clock size={14} />
              <span>Attentive Time: <strong className="live-counter-attentive">{formatHHMMSS(aiStatus.attentiveSec)}</strong></span>
              <span>&middot;</span>
              <span>Away Time: <strong className="live-counter-inattentive">{formatHHMMSS(aiStatus.inattentiveSec)}</strong></span>
            </div>
          </div>
        )}

        <div className="live-classroom-participants">
          <Users size={18} />
          <span>{participants.length + 1} In Session</span>
        </div>
      </header>

      {/* Main stream area */}
      <main className="live-classroom-main">
        <div
          className="live-classroom-video-grid"
          style={{ '--video-grid-columns': videoGridColumns }}
        >
          {/* Local participant video tile */}
          <div
            className={`live-video-tile local-video-tile ${
              aiStatus.phoneDetected ? 'phone-detected' : ''
            }`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ display: videoActive ? 'block' : 'none' }}
              className={`live-video-element local-video-element ${
                screenSharing ? 'screen-sharing' : ''
              }`}
            />

            {/* Circular initials avatar when camera is OFF */}
            {!videoActive && (
              <div className="live-avatar-placeholder">
                <div className="live-avatar-circle">
                  {getInitials(user?.name)}
                </div>
              </div>
            )}

            {/* Phone alert */}
            {!isTeacher && aiStatus.phoneDetected && (
              <div className="live-phone-warning">
                <AlertCircle size={18} />
                <span>
                  Mobile Phone Detected! Please focus on the lecture.
                </span>
              </div>
            )}

            {/* Face detection status badge */}
            {!isTeacher && !aiStatus.phoneDetected && (
              <div className="live-face-status">
                {aiStatus.faceDetected ? (
                  <Eye size={14} className="attention-status-good" />
                ) : (
                  <EyeOff size={14} className="attention-status-warning" />
                )}

                <span>
                  {aiStatus.lookingAway
                    ? 'Looking Away'
                    : aiStatus.faceDetected
                      ? 'Face Detected'
                      : 'No Face'}
                </span>
              </div>
            )}

            {/* Full name is ALWAYS visible (both camera ON and OFF), with [HOST] for teacher */}
            <div className="live-video-name">
              <span>{localDisplayName}</span>
              {!micActive && (
                <span className="live-tile-mic-badge" title="Microphone muted">
                  <MicOff size={13} />
                </span>
              )}
            </div>
          </div>

          {/* Remote video tiles */}
          {Object.entries(remoteStreams).map(
            ([socketId, { stream, user: peerUser }]) => (
              <RemoteVideoTile
                key={socketId}
                stream={stream}
                peerUser={peerUser}
                mediaState={remoteMediaStates[socketId]}
                hostTeacherId={hostTeacherId}
              />
            )
          )}
        </div>
      </main>

      {/* Media controls */}
      <footer className="live-classroom-controls">
        <button
          type="button"
          onClick={toggleMic}
          className={`live-classroom-control ${
            !micActive ? 'control-off' : ''
          }`}
          aria-label={micActive ? 'Mute microphone' : 'Enable microphone'}
          title={micActive ? 'Mute microphone' : 'Enable microphone'}
        >
          {micActive ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          className={`live-classroom-control ${
            !videoActive ? 'control-off' : ''
          }`}
          aria-label={videoActive ? 'Turn camera off' : 'Turn camera on'}
          title={videoActive ? 'Turn camera off' : 'Turn camera on'}
        >
          {videoActive ? <VideoIcon size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`live-classroom-control ${
            screenSharing ? 'control-sharing' : ''
          }`}
          aria-label={screenSharing ? 'Stop screen sharing' : 'Share screen'}
          title={screenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          <Monitor size={20} />
        </button>

        <button
          type="button"
          onClick={handleSessionAction}
          disabled={isEnding}
          className="live-classroom-end-button"
        >
          <PhoneOff size={20} />
          <span>{isTeacher ? (isEnding ? 'Ending...' : 'End Session') : 'Leave Session'}</span>
        </button>
      </footer>
    </div>
  );
};

const RemoteVideoTile = ({ stream, peerUser, mediaState, hostTeacherId }) => {
  const videoRef = useRef(null);
  const isVideoOn = mediaState?.videoActive !== false;
  const isMicOn = mediaState?.micActive !== false;

  // Determine if peer is the Host Teacher
  const isPeerHost =
    peerUser?.role === 'TEACHER' ||
    (hostTeacherId &&
      (peerUser?.userId === hostTeacherId.toString() ||
        peerUser?._id === hostTeacherId.toString() ||
        peerUser?.userId === hostTeacherId ||
        peerUser?._id === hostTeacherId));

  const peerDisplayName = isPeerHost
    ? `${peerUser?.name || 'Teacher'} [HOST]`
    : (peerUser?.name || 'Student');

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div className="live-video-tile remote-video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: isVideoOn ? 'block' : 'none' }}
        className="live-video-element"
      />

      {/* Circular initials avatar when camera is OFF */}
      {!isVideoOn && (
        <div className="live-avatar-placeholder">
          <div className="live-avatar-circle">
            {getInitials(peerUser?.name)}
          </div>
        </div>
      )}

      {/* Full name is ALWAYS visible (both camera ON and OFF), with [HOST] for teacher */}
      <div className="live-video-name">
        <span>{peerDisplayName}</span>
        {!isMicOn && (
          <span className="live-tile-mic-badge" title="Microphone muted">
            <MicOff size={13} />
          </span>
        )}
      </div>
    </div>
  );
};

export default LiveClassRoom;
