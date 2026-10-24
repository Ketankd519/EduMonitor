
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Users,
  Image,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './style.css';
import PostImageCarousel from '../../components/classroom/PostImageCarousel';

const ClassroomView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classDetails, setClassDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('stream');
  const [posts, setPosts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPostContent, setNewPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  // Teacher-only student roster state
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState('');
  const [liveClassError, setLiveClassError] = useState('');
  const [checkingLiveClass, setCheckingLiveClass] = useState(false);

  const backendBase = (API.defaults?.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  useEffect(() => {
    fetchClassroomData();
  }, [classId]);

  const fetchClassroomData = async () => {
    setLoading(true);

    try {
      const classRes = await API.get(`/classes/${classId}`);
      setClassDetails(classRes.data.class || classRes.data);

      const postsRes = await API.get(`/posts/class/${classId}`);
      setPosts(postsRes.data.posts || []);

      const notesRes = await API.get(`/notes/class/${classId}`);
      setNotes(notesRes.data.notes || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classroom data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveClassClick = async () => {
    setLiveClassError('');

    if (isTeacher) {
      navigate(`/live-class/${classId}`);
      return;
    }

    if (checkingLiveClass) return;

    setCheckingLiveClass(true);
    try {
      const response = await API.get(`/live-classes/active/${classId}`);
      const { success, liveSession, message } = response.data;

      if (!success) {
        setLiveClassError(message || 'Unable to check for an active live class session.');
      } else if (!liveSession || liveSession.status !== 'LIVE') {
        setLiveClassError('No active live class session found for this classroom.');
      } else {
        navigate(`/live-class/${classId}`);
      }
    } catch (err) {
      setLiveClassError(
        err.response?.data?.message ||
          'Unable to check for an active live class session. Please try again.'
      );
    } finally {
      setCheckingLiveClass(false);
    }
  };

  const handleOpenRoster = async () => {
    setShowRosterModal(true);
    setRosterLoading(true);
    setRosterError('');
    try {
      const res = await API.get(`/classes/${classId}/roster`);
      setRoster(res.data.roster || []);
    } catch (err) {
      setRosterError(err.response?.data?.message || 'Failed to load classroom roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`File '${file.name}' is not a valid image. Only JPG, PNG, WEBP, and GIF are supported.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File '${file.name}' exceeds the 10MB maximum image limit.`);
        continue;
      }
      if (postImages.length + validFiles.length >= 5) {
        alert('You can attach a maximum of 5 images per post.');
        break;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const updatedImages = [...postImages, ...validFiles];
      setPostImages(updatedImages);

      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPostPreviews((prev) => [...prev, ...newPreviews]);
    }

    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    if (postPreviews[index]) {
      URL.revokeObjectURL(postPreviews[index]);
    }
    setPostImages((prev) => prev.filter((_, i) => i !== index));
    setPostPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && postImages.length === 0) return;

    setSubmittingPost(true);
    try {
      let res;
      if (postImages.length > 0) {
        const formData = new FormData();
        formData.append('classId', classId);
        formData.append('content', newPostContent.trim());
        postImages.forEach((img) => formData.append('images', img));

        res = await API.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await API.post('/posts', {
          classId,
          content: newPostContent.trim()
        });
      }

      setPosts((previous) => [res.data.post, ...previous]);
      setNewPostContent('');
      postPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPostImages([]);
      setPostPreviews([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this announcement?')) return;

    try {
      await API.delete(`/posts/${postId}`);
      setPosts((previous) => previous.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();

    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    try {
      const res = await API.post('/comments', {
        postId,
        content: commentText
      });

      setPosts((previous) =>
        previous.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), res.data.comment]
              }
            : post
        )
      );

      setCommentInputs((previous) => ({
        ...previous,
        [postId]: ''
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);

      setPosts((previous) =>
        previous.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter(
                  (comment) => comment._id !== commentId
                )
              }
            : post
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

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

      setNotes((previous) => [res.data.note, ...previous]);
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
      setNotes((previous) => previous.filter((note) => note._id !== noteId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete note.');
    }
  };

  if (loading) {
    return (
      <div className="classroom-page">
        <Navbar />
        <div className="classroom-layout">
          <Sidebar />
          <main className="classroom-main classroom-loading">
            Loading Virtual Classroom...
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-page">
      <Navbar />

      <div className="classroom-layout">
        <Sidebar />

        <main className="classroom-main">
          {error && (
            <div className="classroom-feedback classroom-error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button type="button" onClick={fetchClassroomData}>
                Retry
              </button>
            </div>
          )}

          {liveClassError && (
            <div className="classroom-feedback classroom-error" role="alert">
              <AlertCircle size={18} />
              <span>{liveClassError}</span>
            </div>
          )}

          {/* Header Banner */}
          <section
            className={`classroom-banner ${
              isTeacher ? 'classroom-banner-teacher' : 'classroom-banner-student'
            }`}
          >
            <div className="classroom-banner-content">
              <span className="classroom-section-badge">
                Section {classDetails?.section}
              </span>

              <h1>{classDetails?.subjectTitle}</h1>

              <p>
                Subject Code: {classDetails?.subjectCode} | Class Code:{' '}
                <strong>{classDetails?.classCode}</strong>
              </p>
            </div>

            <div className="classroom-banner-right">
              <button
                type="button"
                className="classroom-live-btn"
                onClick={handleLiveClassClick}
                disabled={checkingLiveClass}
                aria-busy={checkingLiveClass}
              >
                <Video size={18} />
                <span>
                  {isTeacher
                    ? 'Start Live Class'
                    : checkingLiveClass
                      ? 'Checking...'
                      : 'Join Live Class'}
                </span>
              </button>

              <div className="classroom-enrolled-count">
                Enrolled students: {classDetails?.enrolledStudentsCount ?? 0}
              </div>

              {isTeacher && (
                <button
                  type="button"
                  className="classroom-roster-btn"
                  onClick={handleOpenRoster}
                >
                  <Users size={16} />
                  <span>View Student Roster</span>
                </button>
              )}
            </div>
          </section>

          {/* Classroom Tabs */}
          <div className="classroom-tabs">
            <button
              type="button"
              className={`classroom-tab ${
                activeTab === 'stream' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('stream')}
            >
              Stream Feed
            </button>

            <button
              type="button"
              className={`classroom-tab ${
                activeTab === 'notes' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('notes')}
            >
              Class Notes &amp; Documents
            </button>
          </div>

          {/* Stream Feed */}
          {activeTab === 'stream' && (
            <section className="classroom-stream">
              <div className="classroom-create-post">
                <form onSubmit={handleCreatePost}>
                  <textarea
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Announce something to your class..."
                  />

                  {postPreviews.length > 0 && (
                    <div className="classroom-post-previews">
                      {postPreviews.map((preview, index) => (
                        <div key={index} className="classroom-post-preview-item">
                          <img src={preview} alt={`Selected ${index + 1}`} />
                          <button
                            type="button"
                            className="classroom-preview-remove"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="classroom-post-actions">
                    <label className="classroom-attach-btn" title="Attach image(s)">
                      <Image size={18} />
                      <span>Attach Images</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="submit"
                      className="classroom-primary-btn"
                      disabled={submittingPost || (!newPostContent.trim() && postImages.length === 0)}
                    >
                      <Send size={16} />
                      <span>{submittingPost ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {posts.length === 0 ? (
                <div className="classroom-empty-state">
                  <MessageSquare size={36} />
                  <p>No announcements in this class stream yet.</p>
                </div>
              ) : (
                <div className="classroom-post-list">
                  {posts.map((post) => (
                    <article className="classroom-post-card" key={post._id}>
                      <div className="classroom-post-header">
                        <div className="classroom-author">
                          <div className="classroom-avatar">
                            {post.author?.name
                              ? post.author.name.charAt(0).toUpperCase()
                              : <User size={18} />}
                          </div>

                          <div>
                            <span className="classroom-author-name">
                              {post.author?.name}
                            </span>
                            <span className="classroom-post-date">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {(post.author?._id === user?._id || isTeacher) && (
                          <button
                            type="button"
                            className="classroom-icon-delete"
                            aria-label="Delete announcement"
                            onClick={() => handleDeletePost(post._id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      {post.content && (
                        <p className="classroom-post-content">{post.content}</p>
                      )}

                      {post.attachments && post.attachments.length > 0 && (
                        <PostImageCarousel
                          attachments={post.attachments}
                          backendBase={backendBase}
                          onExpandImage={(src) => setExpandedImage(src)}
                        />
                      )}

                      {/* Comments */}
                      <div className="classroom-comments">
                        {post.comments?.map((comment) => (
                          <div
                            className="classroom-comment"
                            key={comment._id}
                          >
                            <div className="classroom-comment-text">
                              <span className="classroom-comment-author">
                                {comment.author?.name}:{' '}
                              </span>
                              <span>{comment.content}</span>
                            </div>

                            {(comment.author?._id === user?._id || isTeacher) && (
                              <button
                                type="button"
                                className="classroom-icon-delete"
                                aria-label="Delete comment"
                                onClick={() =>
                                  handleDeleteComment(post._id, comment._id)
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}

                        <form
                          className="classroom-comment-form"
                          onSubmit={(e) => handleAddComment(e, post._id)}
                        >
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) =>
                              setCommentInputs((previous) => ({
                                ...previous,
                                [post._id]: e.target.value
                              }))
                            }
                          />

                          <button type="submit" className="classroom-comment-btn">
                            Comment
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Class Notes */}
          {activeTab === 'notes' && (
            <section className="classroom-notes">
              {isTeacher && (
                <div className="classroom-upload-actions">
                  <button
                    type="button"
                    className="classroom-upload-btn"
                    onClick={() => setShowNoteModal(true)}
                  >
                    <Upload size={18} />
                    <span>Upload Material</span>
                  </button>
                </div>
              )}

              {notes.length === 0 ? (
                <div className="classroom-empty-state">
                  <FileText size={36} />
                  <p>No notes or documents uploaded for this class yet.</p>
                </div>
              ) : (
                <div className="classroom-notes-grid">
                  {notes.map((note) => (
                    <article className="classroom-note-card" key={note._id}>
                      <div>
                        <div className="classroom-note-meta">
                          <span className="classroom-file-type">
                            {note.fileType}
                          </span>
                          <span className="classroom-file-size">
                            {(note.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>

                        <h3>{note.title}</h3>
                        <p>
                          {note.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="classroom-note-actions">
                        <a
                          href={`http://localhost:5000${note.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="classroom-download-btn"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>

                        {isTeacher && (
                          <button
                            type="button"
                            className="classroom-icon-delete classroom-note-delete"
                            aria-label="Delete course material"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Upload Note Modal */}
              {showNoteModal && (
                <div
                  className="classroom-modal-overlay"
                  onClick={() => !uploading && setShowNoteModal(false)}
                >
                  <div
                    className="classroom-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="classroom-modal-title"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 id="classroom-modal-title">
                      Upload Classroom Material
                    </h2>

                    <form onSubmit={handleUploadNote}>
                      <div className="classroom-form-group">
                        <label htmlFor="noteTitle">Document Title</label>
                        <input
                          id="noteTitle"
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          required
                          placeholder="e.g. Unit 1 Lecture Notes"
                        />
                      </div>

                      <div className="classroom-form-group">
                        <label htmlFor="noteDescription">
                          Description (Optional)
                        </label>
                        <textarea
                          id="noteDescription"
                          rows={2}
                          value={noteDesc}
                          onChange={(e) => setNoteDesc(e.target.value)}
                          placeholder="Brief summary of document content..."
                        />
                      </div>

                      <div className="classroom-form-group classroom-file-group">
                        <label htmlFor="noteFile">
                          Select File (PDF, PPT, DOC, Images)
                        </label>
                        <input
                          id="noteFile"
                          type="file"
                          onChange={(e) =>
                            setSelectedFile(e.target.files?.[0] || null)
                          }
                          required
                        />
                      </div>

                      <div className="classroom-modal-actions">
                        <button
                          type="button"
                          className="classroom-cancel-btn"
                          disabled={uploading}
                          onClick={() => setShowNoteModal(false)}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="classroom-upload-btn"
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Teacher-only Student Roster Modal */}
          {showRosterModal && (
            <div
              className="classroom-modal-overlay"
              onClick={() => setShowRosterModal(false)}
            >
              <div
                className="classroom-modal classroom-roster-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="classroom-modal-header">
                  <h2>Enrolled Students Roster</h2>
                  <button
                    type="button"
                    className="classroom-modal-close"
                    onClick={() => setShowRosterModal(false)}
                    aria-label="Close roster"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="classroom-roster-subtitle">
                  {classDetails?.subjectTitle} ({classDetails?.classCode}) &bull;{' '}
                  {roster.length} student{roster.length === 1 ? '' : 's'} enrolled
                </p>

                {rosterLoading ? (
                  <div className="classroom-modal-loading">Loading student roster...</div>
                ) : rosterError ? (
                  <div className="classroom-feedback classroom-error">
                    <AlertCircle size={18} />
                    <span>{rosterError}</span>
                    <button type="button" onClick={handleOpenRoster}>Retry</button>
                  </div>
                ) : roster.length === 0 ? (
                  <div className="classroom-empty-state">
                    <Users size={36} />
                    <p>No students enrolled in this classroom yet.</p>
                  </div>
                ) : (
                  <div className="classroom-roster-table-wrapper">
                    <table className="classroom-roster-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Roll Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((student, idx) => (
                          <tr key={student._id}>
                            <td className="roster-index">{idx + 1}</td>
                            <td className="roster-name">{student.name}</td>
                            <td className="roster-roll">{student.rollNumber || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="classroom-modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="classroom-cancel-btn"
                    onClick={() => setShowRosterModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post Image Fullscreen Lightbox */}
          {expandedImage && (
            <div
              className="classroom-image-lightbox"
              onClick={() => setExpandedImage(null)}
            >
              <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={expandedImage} alt="Expanded Attachment" />
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setExpandedImage(null)}
                  aria-label="Close image"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClassroomView;
