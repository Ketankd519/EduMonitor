import { useEffect, useRef, useState } from 'react';
import { analyzeFrame } from '../api/monitoringApi';

const CAPTURE_INTERVAL_MS = 5000; // matches the "don't continuously upload video" requirement (§24)
const CAPTURE_WIDTH = 320; // downscaled — efficiency over fidelity, this is a classifier input, not a recording

/**
 * Captures a still frame from a local MediaStream every few seconds and
 * sends it to the backend for AI analysis. Only ever a single JPEG still
 * per interval leaves the browser — never a continuous video stream —
 * and each frame is discarded immediately after the request completes.
 *
 * Used only on the student's own local stream; students are the only
 * ones monitored (§19), never the teacher's stream.
 */
export function useFrameCapture({ stream, liveClassId, enabled }) {
  const [latestStatus, setLatestStatus] = useState(null);
  const [serviceError, setServiceError] = useState('');

  const videoElRef = useRef(null);
  const canvasElRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !stream || !liveClassId) return;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.play().catch(() => {});
    videoElRef.current = video;

    const canvas = document.createElement('canvas');
    canvasElRef.current = canvas;

    const captureAndSend = async () => {
      if (video.readyState < 2 || !video.videoWidth) return; // not enough data yet

      const scale = CAPTURE_WIDTH / video.videoWidth;
      canvas.width = CAPTURE_WIDTH;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];

      try {
        const res = await analyzeFrame(liveClassId, base64);
        setServiceError('');
        setLatestStatus(res.data.data);
      } catch (err) {
        if (err.response?.status === 503) {
          setServiceError('AI monitoring is temporarily unavailable.');
        }
        // Other errors (e.g. a transient network blip) are not surfaced
        // every 5 seconds — the next successful frame clears serviceError.
      }
    };

    intervalRef.current = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      video.pause();
      video.srcObject = null;
    };
  }, [enabled, stream, liveClassId]);

  return { latestStatus, serviceError };
}
