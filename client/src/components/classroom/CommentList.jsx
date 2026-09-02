import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createComment, deleteComment } from '../../api/commentApi';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentList({ postId, comments, isClassOwner, onCommentsChanged }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createComment(postId, text.trim());
      setText('');
      onCommentsChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      onCommentsChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete comment');
    }
  };

  return (
    <div className="comment-section">
      {error && <div className="alert alert-error">{error}</div>}

      {comments.length === 0 ? (
        <p className="comment-empty">No comments yet.</p>
      ) : (
        comments.map((c) => {
          const canDelete = c.author._id === user?.id || isClassOwner;
          const initials = c.author.fullName
            ? c.author.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
            : '?';
          return (
            <div key={c._id} className="comment-row">
              <div className="comment-avatar">{initials}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{c.author.fullName}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="comment-text">{c.content}</div>
              </div>
              {canDelete && (
                <button className="comment-delete-btn" onClick={() => handleDelete(c._id)}>
                  Delete
                </button>
              )}
            </div>
          );
        })
      )}

      <form className="comment-form" onSubmit={handleAdd}>
        <input
          className="form-input"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary comment-submit-btn" disabled={submitting} type="submit">
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
