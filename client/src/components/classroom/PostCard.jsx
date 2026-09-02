import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CommentList from './CommentList';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function PostCard({ post, isClassOwner, onEdit, onDelete, onRefreshOne }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const isAuthor = post.author._id === user?.id;
  const initials = post.author.fullName
    ? post.author.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const toggleExpand = async () => {
    if (!expanded) {
      const fresh = await onRefreshOne(post._id);
      setComments(fresh || []);
    }
    setExpanded((prev) => !prev);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onEdit(post._id, editText.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">{initials}</div>
        <div>
          <div className="post-author">{post.author.fullName}</div>
          <div className="post-timestamp">{formatDate(post.createdAt)}</div>
        </div>

        {isAuthor && (
          <div className="post-actions">
            <button className="post-action-btn" onClick={() => setEditing((e) => !e)}>
              Edit
            </button>
            <button className="post-action-btn post-action-danger" onClick={() => onDelete(post._id)}>
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="post-edit-area">
          <textarea
            className="post-composer-textarea"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="post-composer-actions">
            <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving} onClick={handleSaveEdit}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}

      <button className="post-comment-toggle" onClick={toggleExpand}>
        {post.commentCount} comment{post.commentCount === 1 ? '' : 's'} {expanded ? '▲' : '▼'}
      </button>

      {expanded && comments !== null && (
        <CommentList
          postId={post._id}
          comments={comments}
          isClassOwner={isClassOwner}
          onCommentsChanged={async () => {
            const fresh = await onRefreshOne(post._id);
            setComments(fresh || []);
          }}
        />
      )}
    </div>
  );
}
