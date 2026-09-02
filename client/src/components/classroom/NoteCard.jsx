import { useState } from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { downloadNote } from '../../api/noteApi';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NoteCard({ note, canDelete, onDelete }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadNote(note._id, note.originalFileName);
    } catch {
      setError('Could not download this file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="note-card">
      <div className="note-icon">
        <FileText size={22} />
      </div>
      <div className="note-info">
        <div className="note-title">{note.title}</div>
        {note.description && <div className="note-description">{note.description}</div>}
        <div className="note-meta">
          {note.fileType.replace('.', '').toUpperCase()} &middot; {formatSize(note.fileSizeBytes)} &middot;
          Uploaded by {note.uploadedBy?.fullName} on {new Date(note.createdAt).toLocaleDateString()}
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '0.4rem' }}>{error}</div>}
      </div>
      <div className="note-actions">
        <button className="note-action-btn" onClick={handleDownload} disabled={downloading} title="Download">
          <Download size={17} />
        </button>
        {canDelete && (
          <button
            className="note-action-btn note-action-danger"
            onClick={() => onDelete(note._id)}
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
