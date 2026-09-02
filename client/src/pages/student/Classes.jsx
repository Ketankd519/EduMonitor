import { useEffect, useState } from 'react';
import { getMyClasses, joinClass, leaveClass } from '../../api/classApi';
import ClassCard from '../../components/classroom/ClassCard';
import JoinClassModal from '../../components/classroom/JoinClassModal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import '../../styles/classroom.css';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [leavingId, setLeavingId] = useState(null);

  const loadClasses = () => {
    setLoading(true);
    getMyClasses()
      .then((res) => setClasses(res.data.data.classes))
      .catch(() => setError('Could not load your classes.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadClasses, []);

  const handleJoined = async (classCode) => {
    await joinClass(classCode);
    setShowJoinModal(false);
    loadClasses();
  };

  const handleLeave = async (classId) => {
    setLeavingId(classId);
    try {
      await leaveClass(classId);
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not leave class.');
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) return <Loader label="Loading classes..." />;

  return (
    <div>
      <h1 className="dashboard-welcome">Classes</h1>
      <p className="dashboard-subtitle">Classes you've joined</p>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      <div className="classes-toolbar">
        <Button
          type="button"
          onClick={() => setShowJoinModal(true)}
          style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
        >
          + Join Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          message="No classes joined yet."
          actionLabel="+ Join Class"
          onAction={() => setShowJoinModal(true)}
        />
      ) : (
        <div className="classes-grid">
          {classes.map((c) => (
            <ClassCard
              key={c._id}
              classItem={c}
              role="student"
              onLeave={handleLeave}
              leaving={leavingId === c._id}
            />
          ))}
        </div>
      )}

      {showJoinModal && (
        <JoinClassModal onClose={() => setShowJoinModal(false)} onJoined={handleJoined} />
      )}
    </div>
  );
}
