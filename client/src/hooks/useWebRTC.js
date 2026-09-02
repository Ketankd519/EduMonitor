import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

/**
 * Manages a real WebRTC mesh call: local camera/mic capture, one
 * RTCPeerConnection per remote participant, and Socket.IO-relayed
 * signaling (offer/answer/ICE). The server never touches media — only
 * SDP/ICE payloads pass through it, relayed to a specific socketId.
 *
 * Join order determines who calls whom: a new joiner receives the current
 * participant list and initiates the offer to each of them, so exactly
 * one offer is created per pair (no double-offer race).
 */
export function useWebRTC({ socket, liveClassId, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream
  const [participants, setParticipants] = useState({}); // socketId -> info
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [connecting, setConnecting] = useState(true);

  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);

  const createPeerConnection = useCallback(
    (targetSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('live:ice-candidate', { liveClassId, targetSocketId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStreams((prev) => ({ ...prev, [targetSocketId]: e.streams[0] }));
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          delete peerConnections.current[targetSocketId];
        }
      };

      peerConnections.current[targetSocketId] = pc;
      return pc;
    },
    [socket, liveClassId]
  );

  const callUser = useCallback(
    async (targetSocketId) => {
      const pc = createPeerConnection(targetSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('live:offer', { liveClassId, targetSocketId, sdp: offer });
    },
    [createPeerConnection, socket, liveClassId]
  );

  useEffect(() => {
    if (!enabled || !socket || !liveClassId) return;
    let cancelled = false;

    async function init() {
      setConnecting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        socket.emit('live:join', { liveClassId }, (res) => {
          if (cancelled) return;
          if (!res?.ok) {
            setMediaError(res?.message || 'Could not join the live class');
            setConnecting(false);
            return;
          }

          const map = {};
          (res.participants || []).forEach((p) => {
            map[p.socketId] = p;
          });
          setParticipants(map);
          setConnecting(false);

          // We're the new joiner — call each existing participant.
          (res.participants || []).forEach((p) => callUser(p.socketId));
        });
      } catch (err) {
        if (!cancelled) {
          setMediaError('Could not access camera/microphone. Please check browser permissions.');
          setConnecting(false);
        }
      }
    }
    init();

    const handleUserJoined = (info) => {
      setParticipants((prev) => ({ ...prev, [info.socketId]: info }));
      // Don't call them — they already called us as part of their own join.
    };

    const handleUserLeft = ({ socketId }) => {
      setParticipants((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
    };

    const handleOffer = async ({ fromSocketId, sdp }) => {
      const pc = createPeerConnection(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('live:answer', { liveClassId, targetSocketId: fromSocketId, sdp: answer });
    };

    const handleAnswer = async ({ fromSocketId, sdp }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Late-arriving candidates for an already-closed connection are expected; ignore.
        }
      }
    };

    const handleMediaState = ({ socketId, camOn: theirCam, micOn: theirMic }) => {
      setParticipants((prev) => ({
        ...prev,
        [socketId]: { ...(prev[socketId] || {}), camOn: theirCam, micOn: theirMic },
      }));
    };

    const handleClassEnded = () => {
      setMediaError('The teacher has ended this live class.');
    };

    socket.on('live:user-joined', handleUserJoined);
    socket.on('live:user-left', handleUserLeft);
    socket.on('live:offer', handleOffer);
    socket.on('live:answer', handleAnswer);
    socket.on('live:ice-candidate', handleIceCandidate);
    socket.on('live:media-state', handleMediaState);
    socket.on('live:class-ended', handleClassEnded);

    return () => {
      cancelled = true;
      socket.off('live:user-joined', handleUserJoined);
      socket.off('live:user-left', handleUserLeft);
      socket.off('live:offer', handleOffer);
      socket.off('live:answer', handleAnswer);
      socket.off('live:ice-candidate', handleIceCandidate);
      socket.off('live:media-state', handleMediaState);
      socket.off('live:class-ended', handleClassEnded);

      socket.emit('live:leave', { liveClassId });
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
    };
  }, [enabled, socket, liveClassId, createPeerConnection, callUser]);

  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
    socket.emit('live:toggle-media', { liveClassId, micOn: audioTrack.enabled, camOn });
  }, [socket, liveClassId, camOn]);

  const toggleCam = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
    socket.emit('live:toggle-media', { liveClassId, micOn, camOn: videoTrack.enabled });
  }, [socket, liveClassId, micOn]);

  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
    }
    setScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => stopScreenShare();
      setScreenSharing(true);
    } catch {
      // User cancelled the screen picker — not an error worth surfacing.
    }
  }, [screenSharing, stopScreenShare]);

  return {
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
  };
}
