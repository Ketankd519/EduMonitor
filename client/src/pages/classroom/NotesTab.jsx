import { useEffect, useState } from 'react';
import { getNotes, uploadNote, deleteNote } from '../../api/noteApi';
import NoteCard from '../../components/classroom/NoteCard';
import NoteUploadModal from '../../components/classroom/NoteUploadModal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

export default function NotesTab({ classId, isClassOwner }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadNotes = () => {
    setLoading(true);
    getNotes(classId)
      .then((res) => setNotes(res.data.data.notes))
      .catch(() => setError('Could not load notes.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadNotes, [classId]);

  const handleUploaded = async (payload) => {
    await uploadNote(classId, payload);
    setShowUploadModal(false);
    loadNotes();
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteNote(noteId);
      loadNotes();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete note.');
    }
  };

  if (loading) return <Loader label="Loading notes..." />;

  return (
    <div>
      {isClassOwner && (
        <div className="classes-toolbar">
          <Button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
          >
            + Upload Note
          </Button>
        </div>
      )}

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {notes.length === 0 ? (
        <EmptyState
          message="No notes uploaded yet."
          actionLabel={isClassOwner ? '+ Upload Note' : undefined}
          onAction={isClassOwner ? () => setShowUploadModal(true) : undefined}
        />
      ) : (
        notes.map((note) => (
          <NoteCard key={note._id} note={note} canDelete={isClassOwner} onDelete={handleDelete} />
        ))
      )}

      {showUploadModal && (
        <NoteUploadModal onClose={() => setShowUploadModal(false)} onUploaded={handleUploaded} />
      )}
    </div>
  );
}
