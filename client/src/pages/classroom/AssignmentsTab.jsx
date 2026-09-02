import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssignments, deleteAssignment } from '../../api/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

function getStatus(assignment) {
  const now = new Date();
  const start = new Date(assignment.startDate);
  const end = new Date(assignment.endDate);

  if (assignment.mySubmission) return { label: 'Submitted', cls: 'assignment-status-submitted' };
  if (now < start) return { label: 'Upcoming', cls: 'assignment-status-upcoming' };
  if (now > end) return { label: 'Expired', cls: 'assignment-status-expired' };
  return { label: 'Open', cls: 'assignment-status-open' };
}

export default function AssignmentsTab({ classId, isClassOwner }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAssignments = () => {
    setLoading(true);
    getAssignments(classId)
      .then((res) => setAssignments(res.data.data.assignments))
      .catch(() => setError('Could not load assignments.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAssignments, [classId]);

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Delete this assignment? All student submissions will be lost.')) return;
    try {
      await deleteAssignment(assignmentId);
      loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete assignment.');
    }
  };

  if (loading) return <Loader label="Loading assignments..." />;

  return (
    <div>
      {isClassOwner && (
        <div className="classes-toolbar">
          <Button
            type="button"
            onClick={() => navigate(`/teacher/classes/${classId}/assignments/new`)}
            style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
          >
            + Create Assignment
          </Button>
        </div>
      )}

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {assignments.length === 0 ? (
        <EmptyState
          message="No assignments available."
          actionLabel={isClassOwner ? '+ Create Assignment' : undefined}
          onAction={isClassOwner ? () => navigate(`/teacher/classes/${classId}/assignments/new`) : undefined}
        />
      ) : (
        assignments.map((a) => {
          const status = getStatus(a);
          return (
            <div className="assignment-row" key={a._id}>
              <div className="assignment-row-main">
                <div className="assignment-title">{a.title}</div>
                <div className="assignment-meta">
                  {a.questionCount} question{a.questionCount === 1 ? '' : 's'} &middot; {a.totalMarks} marks
                  &middot; Due {new Date(a.endDate).toLocaleString()}
                  {a.mySubmission && (
                    <> &middot; Score: {a.mySubmission.score}/{a.mySubmission.totalMarks} ({a.mySubmission.percentage}%)</>
                  )}
                </div>
              </div>
              <span className={`assignment-status-badge ${status.cls}`}>{status.label}</span>
              <div className="assignment-actions">
                {user.role === 'student' && (
                  <Button
                    type="button"
                    onClick={() => navigate(`/student/assignments/${a._id}`)}
                    disabled={status.label === 'Upcoming'}
                  >
                    {a.mySubmission ? 'View Result' : status.label === 'Expired' ? 'Expired' : 'Start'}
                  </Button>
                )}
                {isClassOwner && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(`/teacher/assignments/${a._id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(`/teacher/assignments/${a._id}/results`)}
                    >
                      Results
                    </Button>
                    <Button type="button" variant="danger" onClick={() => handleDelete(a._id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
