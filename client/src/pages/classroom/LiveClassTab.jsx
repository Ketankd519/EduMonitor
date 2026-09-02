import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import { getActiveLiveClass, startLiveClass } from '../../api/liveClassApi';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

export default function LiveClassTab({ classId, isClassOwner }) {
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeLiveClass, setActiveLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const loadActive = () => {
    getActiveLiveClass(classId)
      .then((res) => setActiveLiveClass(res.data.data.liveClass))
      .catch(() => setError('Could not check live class status.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadActive, [classId]);

  // Join the class notification room so live:class-started/ended arrive
  // in real time while this tab is open, instead of only on next visit.
  useEffect(() => {
    if (!socket) return;

    socket.emit('class:join', { classId });

    const handleStarted = (payload) => {
      if (payload.classId === classId) {
        setActiveLiveClass({ _id: payload.liveClassId });
      }
    };
    const handleEnded = (payload) => {
      if (!payload.classId || payload.classId === classId) {
        setActiveLiveClass(null);
      }
    };

    socket.on('live:class-started', handleStarted);
    socket.on('live:class-ended', handleEnded);

    return () => {
      socket.emit('class:leave', { classId });
      socket.off('live:class-started', handleStarted);
      socket.off('live:class-ended', handleEnded);
    };
  }, [socket, classId]);

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await startLiveClass(classId);
      navigate(`/teacher/classes/${classId}/live/${res.data.data.liveClass._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start live class.');
      setStarting(false);
    }
  };

  const handleJoin = () => {
    const role = isClassOwner ? 'teacher' : 'student';
    navigate(`/${role}/classes/${classId}/live/${activeLiveClass._id}`);
  };

  if (loading) return <Loader label="Checking live class status..." />;

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <Video size={40} color="#1e3a8a" style={{ marginBottom: '1rem' }} />

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {activeLiveClass ? (
        <>
          <h2 style={{ marginBottom: '0.5rem' }}>A live class is in progress</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            {isClassOwner ? 'You can rejoin your live session.' : 'Your teacher has started a live session.'}
          </p>
          <Button type="button" onClick={handleJoin} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Join Live Class
          </Button>
        </>
      ) : isClassOwner ? (
        <>
          <h2 style={{ marginBottom: '0.5rem' }}>Start a live class</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Students will be able to join once you start the session.
          </p>
          <Button type="button" loading={starting} onClick={handleStart} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Start Live Class
          </Button>
        </>
      ) : (
        <>
          <h2 style={{ marginBottom: '0.5rem' }}>No live class right now</h2>
          <p style={{ color: '#64748b' }}>You'll be able to join as soon as your teacher starts one.</p>
        </>
      )}
    </div>
  );
}
