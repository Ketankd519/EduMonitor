import { useState } from 'react';
import Button from '../common/Button';

export default function PostComposer({ onSubmit }) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Write something before posting');
      return;
    }
    setError('');
    setPosting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <textarea
        className="post-composer-textarea"
        placeholder="Share something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      {error && <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>{error}</div>}
      <div className="post-composer-actions">
        <Button
          type="submit"
          loading={posting}
          style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
        >
          Post
        </Button>
      </div>
    </form>
  );
}
