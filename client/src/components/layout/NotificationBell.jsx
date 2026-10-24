import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Bell, Radio, Check, X, FileCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveTicker } from '../../context/LiveTickerContext';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import './Layouts.css';

const NotificationBell = () => {
  const { liveItems } = useLiveTicker();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`read_announcements_${user?._id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync read announcements to localStorage when updated
  useEffect(() => {
    if (user?._id) {
      try {
        localStorage.setItem(
          `read_announcements_${user._id}`,
          JSON.stringify(readAnnouncementIds)
        );
      } catch (e) {}
    }
  }, [readAnnouncementIds, user?._id]);

  // Fetch recent announcements for the notification dropdown
  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === 'STUDENT') {
        const res = await API.get('/users/dashboard');
        setAnnouncements(res.data?.recentPosts || []);
      }
    } catch (err) {
      // Soft failure
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Close on outside click and Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadAnnouncements = announcements.filter(
    (a) => !readAnnouncementIds.includes(a._id)
  );

  const hasLiveItems = liveItems && liveItems.length > 0;
  const hasUnread = unreadAnnouncements.length > 0;
  const showRedDot = hasLiveItems || hasUnread;

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    const allIds = announcements.map((a) => a._id);
    setReadAnnouncementIds(Array.from(new Set([...readAnnouncementIds, ...allIds])));
  };

  const handleLiveItemClick = (item) => {
    setIsOpen(false);
    if (item.type === 'live-class') {
      navigate(`/classroom/${item.classId}`);
    } else {
      navigate('/assignments', {
        state: { classId: item.classId, assignmentId: item.assignmentId }
      });
    }
  };

  const handleAnnouncementClick = (announcement) => {
    if (!readAnnouncementIds.includes(announcement._id)) {
      setReadAnnouncementIds((prev) => [...prev, announcement._id]);
    }
    setIsOpen(false);
    if (announcement.class?._id) {
      navigate(`/classroom/${announcement.class._id}`);
    }
  };

  return (
    <div className="navbar-notification-wrapper">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="navbar-notification"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications${showRedDot ? ' (New notifications active)' : ''}`}
        title="Notifications"
      >
        <Bell size={20} />
        {showRedDot && (
          <span
            className="navbar-notification-dot"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="navbar-notifications-dropdown"
          role="dialog"
          aria-label="Notification center"
        >
          <div className="notifications-dropdown-header">
            <div className="notifications-header-title">
              <span>Notifications</span>
              {hasLiveItems && (
                <span className="notifications-live-chip">LIVE</span>
              )}
            </div>

            <div className="notifications-header-actions">
              {hasUnread && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="notifications-mark-read-btn"
                  title="Mark all announcements as read"
                >
                  <Check size={14} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="notifications-close-btn"
                aria-label="Close notifications dropdown"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notifications-dropdown-body">
            {/* Live Activities Section */}
            {hasLiveItems && (
              <div className="notifications-section">
                <div className="notifications-section-title">
                  <span className="live-dot-pulse" aria-hidden="true" />
                  <span>Live Now</span>
                </div>
                <div className="notifications-list">
                  {liveItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLiveItemClick(item)}
                      className="notification-item notification-item--live"
                    >
                      <div className="notification-item-icon">
                        {item.type === 'live-class' ? (
                          <Radio size={16} color="#dc2626" />
                        ) : (
                          <FileCheck size={16} color="#dc2626" />
                        )}
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-title">
                          {item.text}
                        </div>
                        <div className="notification-item-sub">
                          {item.type === 'live-class'
                            ? 'Classroom session is underway • Click to view'
                            : 'MCQ Test is open • Click to view in Assignments'}
                        </div>
                      </div>
                      <ExternalLink size={14} className="notification-item-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements / Updates Section */}
            {announcements.length > 0 && (
              <div className="notifications-section">
                <div className="notifications-section-title">
                  <span>Announcements</span>
                </div>
                <div className="notifications-list">
                  {announcements.map((post) => {
                    const isUnread = !readAnnouncementIds.includes(post._id);
                    return (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => handleAnnouncementClick(post)}
                        className={`notification-item ${isUnread ? 'notification-item--unread' : ''}`}
                      >
                        <div className="notification-item-content">
                          <div className="notification-item-title">
                            {post.class?.subjectTitle || 'Class Announcement'}
                          </div>
                          <div className="notification-item-preview">
                            {post.content}
                          </div>
                          <div className="notification-item-time">
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString()
                              : ''}
                          </div>
                        </div>
                        {isUnread && (
                          <span
                            className="notification-unread-indicator"
                            title="Unread"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasLiveItems && announcements.length === 0 && (
              <div className="notifications-empty">
                <Bell size={32} color="var(--text-muted)" />
                <p>No notifications right now.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
