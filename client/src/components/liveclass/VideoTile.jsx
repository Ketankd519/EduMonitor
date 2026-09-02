import { useEffect, useRef } from 'react';
import { MicOff } from 'lucide-react';

export default function VideoTile({ stream, name, isLocal, camOn = true, micOn = true, overlay }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="video-tile">
      {stream && camOn ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="video-tile-el" />
      ) : (
        <div className="video-tile-placeholder">
          <div className="video-tile-avatar">{initials}</div>
        </div>
      )}
      {overlay}
      <div className="video-tile-label">
        {!micOn && <MicOff size={13} />}
        <span>{name}{isLocal ? ' (You)' : ''}</span>
      </div>
    </div>
  );
}
