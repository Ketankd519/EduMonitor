import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyClasses } from '../../api/classApi';
import { getAssignments } from '../../api/assignmentApi';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

function getStatus(a) {
  const now = new Date();
  if (now < new Date(a.startDate)) return { label: 'Upcoming', cls: 'assignment-status-upcoming' };
  if (now > new Date(a.endDate)) return { label: 'Expired', cls: 'assignment-status-expired' };
  return { label: 'Open', cls: 'assignment-status-open' };
}

/**
 * Aggregates assignments across every class this teacher owns — fetched
 * per-class from the same endpoint used inside a single classroom.
 */
export default function TeacherAssignments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getMyClasses()
      .then(async (res) => {
        const classes = res.data.data.classes;
        const perClass = await Promise.all(
          classes.map((c) =>
            getAssignments(c._id).then((r) =>
              r.data.data.assignments.map((a) => ({ ...a, classInfo: c }))
            )
          )
        );
        if (!cancelled) {
          const flat = perClass.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRows(flat);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load assignments.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader label="Loading assignments..." />;
  if (error) return <EmptyState message={error} />;

  return (
    <div>
      <h1 className="dashboard-welcome">Assignments</h1>
      <p className="dashboard-subtitle">Across all your classes</p>

      {rows.length === 0 ? (
        <EmptyState message="You haven't created any assignments yet. Open a class and use its Assignment tab to create one." />
      ) : (
        rows.map((a) => {
          const status = getStatus(a);
          return (
            <div className="assignment-row" key={a._id}>
              <div className="assignment-row-main">
                <div className="assignment-title">{a.title}</div>
                <div className="assignment-meta">
                  {a.classInfo.subjectCode} &middot; {a.questionCount} question{a.questionCount === 1 ? '' : 's'} &middot;{' '}
                  {a.totalMarks} marks &middot; Due {new Date(a.endDate).toLocaleString()}
                </div>
              </div>
              <span className={`assignment-status-badge ${status.cls}`}>{status.label}</span>
              <div className="assignment-actions">
                <Button type="button" variant="secondary" onClick={() => navigate(`/teacher/assignments/${a._id}/edit`)}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate(`/teacher/assignments/${a._id}/results`)}>
                  Results
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
