import { useEffect, useState } from 'react';
import { getMyClasses, createClass, deleteClass } from '../../api/classApi';
import ClassCard from '../../components/classroom/ClassCard';
import CreateClassModal from '../../components/classroom/CreateClassModal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import '../../styles/classroom.css';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadClasses = () => {
    setLoading(true);
    getMyClasses()
      .then((res) => setClasses(res.data.data.classes))
      .catch(() => setError('Could not load your classes.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadClasses, []);

  const handleCreated = async (form) => {
    await createClass(form);
    setShowCreateModal(false);
    loadClasses();
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Delete this class? Students will lose access to it.')) return;
    setDeletingId(classId);
    try {
      await deleteClass(classId);
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete class.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loader label="Loading classes..." />;

  return (
    <div>
      <h1 className="dashboard-welcome">My Classes</h1>
      <p className="dashboard-subtitle">Classes you've created</p>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      <div className="classes-toolbar">
        <Button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
        >
          + Create Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          message="You haven't created any classes yet."
          actionLabel="+ Create Class"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="classes-grid">
          {classes.map((c) => (
            <ClassCard
              key={c._id}
              classItem={c}
              role="teacher"
              onDelete={handleDelete}
              deleting={deletingId === c._id}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateClassModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
