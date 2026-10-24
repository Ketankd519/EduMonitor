import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const LiveTickerContext = createContext({
  liveItems: [],
  loading: false,
  refreshLiveTicker: () => {}
});

export const LiveTickerProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isMountedRef = useRef(true);
  const currentUserIdRef = useRef(user?._id || null);
  const nextTimerRef = useRef(null);
  const activeRequestRef = useRef(0);

  const isStudent = user?.role === 'STUDENT';

  // Authoritative fetch function
  const fetchLiveTicker = useCallback(async () => {
    if (!token || !isStudent) {
      if (isMountedRef.current) setLiveItems([]);
      return;
    }

    const requestId = ++activeRequestRef.current;
    const fetchUserId = user?._id;

    try {
      setLoading(true);
      const res = await API.get('/live-classes/live-ticker');

      // Prevent race conditions: Ensure component is mounted, request is latest, and user hasn't switched
      if (
        isMountedRef.current &&
        requestId === activeRequestRef.current &&
        (!fetchUserId || !currentUserIdRef.current || String(currentUserIdRef.current) === String(fetchUserId))
      ) {
        const rawItems = res.data?.liveItems || [];

        // Deduplicate notification data using stable identifiers (type + classId or assignmentId)
        // Does not deduplicate solely by display text so distinct assignments never disappear
        const seen = new Set();
        const deduplicatedItems = [];
        for (const item of rawItems) {
          const stableKey =
            item.type === 'live-class'
              ? `live-class-${item.classId}`
              : `live-assignment-${item.assignmentId}`;
          if (!seen.has(stableKey)) {
            seen.add(stableKey);
            deduplicatedItems.push({
              ...item,
              stableKey
            });
          }
        }

        setLiveItems(deduplicatedItems);

        // Schedule precise timer for next upcoming assignment start or expiry
        if (nextTimerRef.current) {
          clearTimeout(nextTimerRef.current);
          nextTimerRef.current = null;
        }

        const nowMs = Date.now();
        let nextEventMs = null;

        deduplicatedItems.forEach((item) => {
          if (item.type === 'live-assignment') {
            if (item.startDate) {
              const startMs = new Date(item.startDate).getTime();
              if (startMs > nowMs && (!nextEventMs || startMs < nextEventMs)) {
                nextEventMs = startMs;
              }
            }
            if (item.endDate) {
              const endMs = new Date(item.endDate).getTime();
              if (endMs > nowMs && (!nextEventMs || endMs < nextEventMs)) {
                nextEventMs = endMs;
              }
            }
          }
        });

        if (nextEventMs) {
          const delay = Math.max(1000, nextEventMs - nowMs + 500); // 500ms grace
          if (delay < 86400000) { // Under 24h
            nextTimerRef.current = setTimeout(() => {
              if (isMountedRef.current && currentUserIdRef.current === fetchUserId) {
                fetchLiveTicker();
              }
            }, delay);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live notifications:', err?.response?.data?.message || err.message);
    } finally {
      if (isMountedRef.current && requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [token, isStudent, user?._id]);

  // Track user ID change and reset on logout or switch
  useEffect(() => {
    isMountedRef.current = true;
    currentUserIdRef.current = user?._id || null;

    if (!token || !isStudent) {
      setLiveItems([]);
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
      return;
    }

    // Initial load
    fetchLiveTicker();

    // Bounded fallback polling: every 60 seconds
    const pollInterval = setInterval(() => {
      fetchLiveTicker();
    }, 60000);

    // Browser focus & online reconciliation
    const handleFocus = () => fetchLiveTicker();
    const handleOnline = () => fetchLiveTicker();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
    };
  }, [token, isStudent, user?._id, fetchLiveTicker]);

  // Socket real-time updates (prevents duplicate listeners via proper cleanup)
  useEffect(() => {
    if (!socket || !token || !isStudent) return;

    const handleSocketUpdate = () => {
      fetchLiveTicker();
    };

    socket.on('live-ticker-update', handleSocketUpdate);
    socket.on('live-class-started', handleSocketUpdate);
    socket.on('session-ended', handleSocketUpdate);
    socket.on('connect', handleSocketUpdate);
    socket.on('reconnect', handleSocketUpdate);

    return () => {
      socket.off('live-ticker-update', handleSocketUpdate);
      socket.off('live-class-started', handleSocketUpdate);
      socket.off('session-ended', handleSocketUpdate);
      socket.off('connect', handleSocketUpdate);
      socket.off('reconnect', handleSocketUpdate);
    };
  }, [socket, token, isStudent, fetchLiveTicker]);

  return (
    <LiveTickerContext.Provider
      value={{
        liveItems,
        loading,
        refreshLiveTicker: fetchLiveTicker
      }}
    >
      {children}
    </LiveTickerContext.Provider>
  );
};

export const useLiveTicker = () => useContext(LiveTickerContext);
