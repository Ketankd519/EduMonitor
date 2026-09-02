import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

export default function ClassCard({ classItem, role, onDelete, onLeave, deleting, leaving }) {
  const navigate = useNavigate();

  return (
    <div className="class-card">
      <div className="class-card-code">{classItem.subjectCode}</div>
      <div className="class-card-section">Section: {classItem.section}</div>
      <div className="class-card-title">{classItem.subjectTitle}</div>
      <div className="class-card-meta">
        Class Code: {classItem.classCode}
        {typeof classItem.memberCount === 'number' && (
          <>
            {' '}
            &middot; {classItem.memberCount} student{classItem.memberCount === 1 ? '' : 's'}
          </>
        )}
        {classItem.teacher?.fullName && <> &middot; {classItem.teacher.fullName}</>}
      </div>

      <div className="class-card-actions">
        <Button
          type="button"
          onClick={() => navigate(`/${role}/classes/${classItem._id}`)}
        >
          Open Class
        </Button>

        {role === 'teacher' && (
          <Button type="button" variant="danger" loading={deleting} onClick={() => onDelete(classItem._id)}>
            Delete
          </Button>
        )}

        {role === 'student' && (
          <Button type="button" variant="secondary" loading={leaving} onClick={() => onLeave(classItem._id)}>
            Leave
          </Button>
        )}
      </div>
    </div>
  );
}
