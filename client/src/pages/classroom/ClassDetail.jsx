import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getClassById, getClassStudents } from '../../api/classApi';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import PostsTab from './PostsTab';
import NotesTab from './NotesTab';
import AssignmentsTab from './AssignmentsTab';
import LiveClassTab from './LiveClassTab';
import '../../styles/classroom.css';

const TABS = [
  { key: 'posts', label: 'Post' },
  { key: 'assignments', label: 'Assignment' },
  { key: 'notes', label: 'Notes' },
  { key: 'live', label: 'Live Class' },
];

export default function ClassDetail() {
  const { classId } = useParams();
  const { user } = useAuth();

  const [classInfo, setClassInfo] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getClassById(classId)
      .then((res) => {
        if (cancelled) return;
        setClassInfo(res.data.data.class);
        setIsOwner(res.data.data.isOwner);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load this class.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  if (loading) return <Loader label="Loading class..." />;
  if (error) return <EmptyState message={error} />;

  return (
    <div>
      <div className="class-detail-header">
        <div className="class-detail-code">
          {classInfo.subjectCode} &middot; Section {classInfo.section}
        </div>
        <h1 className="class-detail-title">{classInfo.subjectTitle}</h1>
        <div className="class-detail-meta">
          Class Code: <strong>{classInfo.classCode}</strong>
          {classInfo.teacher?.fullName && <> &middot; Taught by {classInfo.teacher.fullName}</>}
          {typeof classInfo.memberCount === 'number' && (
            <>
              {' '}
              &middot; {classInfo.memberCount} student{classInfo.memberCount === 1 ? '' : 's'} enrolled
            </>
          )}
        </div>
      </div>

      <div className="classroom-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`classroom-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && <PostsTab classId={classId} isClassOwner={isOwner} />}
      {activeTab === 'notes' && <NotesTab classId={classId} isClassOwner={isOwner} />}
      {activeTab === 'assignments' && <AssignmentsTab classId={classId} isClassOwner={isOwner} />}
      {activeTab === 'live' && <LiveClassTab classId={classId} isClassOwner={isOwner} />}

      {user?.role === 'teacher' && isOwner && (
        <div style={{ marginTop: '2rem' }}>
          <RosterPreview classId={classId} />
        </div>
      )}
    </div>
  );
}

/**
 * Small inline roster preview kept from Phase 4 so teachers still have a
 * quick way to see who's enrolled without leaving the classroom page.
 */
function RosterPreview({ classId }) {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getClassStudents(classId).then((res) => {
      if (!cancelled) setStudents(res.data.data.students);
    });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const apiOrigin = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  if (students === null) return null;

  return (
    <>
      <h2 className="section-title">Enrolled Students</h2>
      {students.length === 0 ? (
        <EmptyState message="No students have joined this class yet." />
      ) : (
        <div className="profile-card" style={{ maxWidth: '100%' }}>
          {students.map((s) => {
            const initials = s.fullName
              ? s.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
              : '?';
            return (
              <div key={s._id} className="student-list-row">
                <div className="student-list-avatar">
                  {s.avatarUrl ? <img src={`${apiOrigin}${s.avatarUrl}`} alt={s.fullName} /> : initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.email}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
