import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Square } from 'lucide-react';

export default function ControlsBar({
  micOn,
  camOn,
  screenSharing,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onLeave,
  onEndClass,
  isTeacher,
}) {
  return (
    <div className="liveclass-controls">
      <button
        className={`liveclass-control-btn${!micOn ? ' off' : ''}`}
        onClick={onToggleMic}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      <button
        className={`liveclass-control-btn${!camOn ? ' off' : ''}`}
        onClick={onToggleCam}
        title={camOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      <button
        className={`liveclass-control-btn${screenSharing ? ' active' : ''}`}
        onClick={onToggleScreenShare}
        title={screenSharing ? 'Stop screen share' : 'Share screen'}
      >
        <ScreenShare size={20} />
      </button>

      <button className="liveclass-control-btn danger" onClick={onLeave} title="Leave class">
        <PhoneOff size={20} />
      </button>

      {isTeacher && (
        <button className="liveclass-control-btn danger-solid" onClick={onEndClass} title="End class for everyone">
          <Square size={16} />
          End Class
        </button>
      )}
    </div>
  );
}
