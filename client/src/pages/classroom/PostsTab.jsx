import { useEffect, useState, useCallback } from 'react';
import { getPosts, createPost, updatePost, deletePost } from '../../api/postApi';
import { getComments } from '../../api/commentApi';
import PostComposer from '../../components/classroom/PostComposer';
import PostCard from '../../components/classroom/PostCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

export default function PostsTab({ classId, isClassOwner }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadPosts = useCallback(
    (searchTerm = '') => {
      setLoading(true);
      return getPosts(classId, searchTerm)
        .then((res) => setPosts(res.data.data.posts))
        .catch(() => setError('Could not load posts.'))
        .finally(() => setLoading(false));
    },
    [classId]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Debounced search-as-you-type against the real backend query, not a client-side filter
  useEffect(() => {
    const handle = setTimeout(() => loadPosts(search), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async (content) => {
    await createPost(classId, content);
    await loadPosts(search);
  };

  const handleEdit = async (postId, content) => {
    await updatePost(postId, content);
    await loadPosts(search);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? This will also remove its comments.')) return;
    await deletePost(postId);
    await loadPosts(search);
  };

  const handleRefreshComments = async (postId) => {
    const res = await getComments(postId);
    return res.data.data.comments;
  };

  return (
    <div>
      <div className="classroom-search-row">
        <input
          className="form-input classroom-search-input"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isClassOwner && <PostComposer onSubmit={handleCreate} />}

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <Loader label="Loading posts..." />
      ) : posts.length === 0 ? (
        <EmptyState message={search ? 'No posts match your search.' : 'No announcements yet.'} />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            isClassOwner={isClassOwner}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefreshOne={handleRefreshComments}
          />
        ))
      )}
    </div>
  );
}
