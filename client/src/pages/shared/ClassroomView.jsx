import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import {
  MessageSquare,
  FileText,
  Send,
  Trash2,
  Upload,
  Download,
  Video,
  User,
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ClassroomView = () => {
  const { classId } = useParams();
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classDetails, setClassDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('stream'); // 'stream' | 'notes'
  const [posts, setPosts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  // Note Upload states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassroomData();
  }, [classId]);

  const fetchClassroomData = async () => {
    try {
      const classRes = await API.get(`/classes/${classId}`);
      setClassDetails(classRes.data.class || classRes.data);

      const postsRes = await API.get(`/posts/class/${classId}`);
      setPosts(postsRes.data.posts || []);

      const notesRes = await API.get(`/notes/class/${classId}`);
      setNotes(notesRes.data.notes || []);
    } catch (err) {
      setError('Failed to load classroom data.');
    } finally {
      setLoading(false);
    }
  };

  // --- Post Handlers ---
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const res = await API.post('/posts', { classId, content: newPostContent });
      setPosts([res.data.post, ...posts]);
      setNewPostContent('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await API.delete(`/posts/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  // --- Comment Handlers ---
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await API.post('/comments', { postId, content: commentText });
      setPosts(
        posts.map((p) => {
          if (p._id === postId) {
            return { ...p, comments: [...p.comments, res.data.comment] };
          }
          return p;
        })
      );
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setPosts(
        posts.map((p) => {
          if (p._id === postId) {
            return { ...p, comments: p.comments.filter((c) => c._id !== commentId) };
          }
          return p;
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  // --- Note Upload Handlers ---
  const handleUploadNote = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('Please select a file to upload.');

    const formData = new FormData();
    formData.append('classId', classId);
    formData.append('title', noteTitle);
    formData.append('description', noteDesc);
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await API.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNotes([res.data.note, ...notes]);
      setShowNoteModal(false);
      setNoteTitle('');
      setNoteDesc('');
      setSelectedFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this course material?')) return;
    try {
      await API.delete(`/notes/${noteId}`);
      setNotes(notes.filter((n) => n._id !== noteId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete note.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
        <Navbar />
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ padding: '2rem' }}>Loading Virtual Classroom...</main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px' }}>
          {/* Header Banner */}
          <div style={{
            background: isTeacher ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  Section {classDetails?.section}
                </span>
                <h1 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{classDetails?.subjectTitle}</h1>
                <p style={{ margin: '0.25rem 0 0', opacity: 0.9 }}>Subject Code: {classDetails?.subjectCode} | Class Code: <strong>{classDetails?.classCode}</strong></p>
              </div>

              <Link to={`/live-class/${classId}`} style={{
                background: '#dc2626',
                color: '#fff',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Video size={18} />
                <span>{isTeacher ? 'Start Live Class' : 'Join Live Class'}</span>
              </Link>
            </div>
          </div>

          {/* Classroom Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('stream')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: activeTab === 'stream' ? 'var(--primary-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === 'stream' ? '3px solid var(--primary-blue)' : '3px solid transparent'
              }}
            >
              Stream Feed
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: activeTab === 'notes' ? 'var(--primary-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === 'notes' ? '3px solid var(--primary-blue)' : '3px solid transparent'
              }}
            >
              Class Notes & Documents
            </button>
          </div>

          {/* TAB 1: STREAM FEED */}
          {activeTab === 'stream' && (
            <div>
              {/* Create Post Box */}
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                <form onSubmit={handleCreatePost}>
                  <textarea
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Announce something to your class..."
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" style={{ background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Send size={16} />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Stream */}
              {posts.length === 0 ? (
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} style={{ marginBottom: '0.5rem' }} />
                  <p>No announcements in this class stream yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {posts.map((post) => (
                    <div key={post._id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {post.author?.name ? post.author.name.charAt(0).toUpperCase() : <User size={18} />}
                          </div>
                          <div>
                            <span style={{ fontWeight: 'bold', display: 'block', fontSize: '0.95rem' }}>{post.author?.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {(post.author?._id === user._id || isTeacher) && (
                          <button onClick={() => handleDeletePost(post._id)} style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-dark)', whitespace: 'pre-line' }}>{post.content}</p>

                      {/* Comments Thread */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        {post.comments?.map((comment) => (
                          <div key={comment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary-blue)' }}>{comment.author?.name}: </span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{comment.content}</span>
                            </div>
                            {(comment.author?._id === user._id || isTeacher) && (
                              <button onClick={() => handleDeleteComment(post._id, comment._id)} style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer', padding: 0 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Add Comment Input */}
                        <form onSubmit={(e) => handleAddComment(e, post._id)} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                            style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                          />
                          <button type="submit" style={{ background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.45rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Comment
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLASS NOTES */}
          {activeTab === 'notes' && (
            <div>
              {isTeacher && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    style={{ background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Upload size={18} />
                    <span>Upload Material</span>
                  </button>
                </div>
              )}

              {notes.length === 0 ? (
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ marginBottom: '0.5rem' }} />
                  <p>No notes or documents uploaded for this class yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {notes.map((note) => (
                    <div key={note._id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ background: '#dbeafe', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {note.fileType}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {(note.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{note.title}</h3>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{note.description || 'No description provided.'}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <a
                          href={`http://localhost:5000${note.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{ flex: 1, background: 'var(--primary-blue)', color: '#fff', textAlign: 'center', padding: '0.5rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>

                        {isTeacher && (
                          <button onClick={() => handleDeleteNote(note._id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: 'var(--danger-red)', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Note Modal */}
              {showNoteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#fff', width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
                    <h2 style={{ margin: '0 0 1.25rem', color: 'var(--text-dark)' }}>Upload Classroom Material</h2>

                    <form onSubmit={handleUploadNote}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Document Title</label>
                        <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required placeholder="e.g. Unit 1 Lecture Notes" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Description (Optional)</label>
                        <textarea rows={2} value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)} placeholder="Brief summary of document content..." style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'none' }} />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Select File (PDF, PPT, DOC, Images)</label>
                        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} required style={{ width: '100%', padding: '0.5rem' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowNoteModal(false)} style={{ background: '#e2e8f0', color: 'var(--text-dark)', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button type="submit" disabled={uploading} style={{ background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClassroomView;