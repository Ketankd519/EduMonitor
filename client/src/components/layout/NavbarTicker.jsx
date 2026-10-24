import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveTicker } from '../../context/LiveTickerContext';
import './Layouts.css';

const NavbarTicker = ({ mode = 'desktop' }) => {
  const { liveItems } = useLiveTicker();
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const [duration, setDuration] = useState(25);

  // Deduplicate items using stable identifiers (type + classId / assignmentId)
  // Ensure each unique notification appears exactly once in the sequence
  // Must execute unconditionally on every render to satisfy Rules of Hooks
  const uniqueItems = useMemo(() => {
    if (!liveItems || liveItems.length === 0) return [];
    const seen = new Set();
    const items = [];
    for (const item of liveItems) {
      const key =
        item.type === 'live-class'
          ? `live-class-${item.classId}`
          : `live-assignment-${item.assignmentId}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          ...item,
          stableKey: key
        });
      }
    }
    return items;
  }, [liveItems]);

  // Recalculate animation duration smoothly based on total travel distance (viewport width + content width)
  // Must execute unconditionally on every render to satisfy Rules of Hooks
  useEffect(() => {
    if (uniqueItems.length === 0) return;

    const calculateDuration = () => {
      if (!viewportRef.current || !contentRef.current) return;
      const viewportWidth = viewportRef.current.offsetWidth || 0;
      const contentWidth = contentRef.current.scrollWidth || 0;
      const totalDistance = viewportWidth + contentWidth;

      // Comfortable, smooth reading speed (~55px per second)
      const computedDuration = Math.max(12, Math.round(totalDistance / 55));
      setDuration((prev) => (Math.abs(prev - computedDuration) > 1 ? computedDuration : prev));
    };

    calculateDuration();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && viewportRef.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateDuration();
      });
      resizeObserver.observe(viewportRef.current);
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }
    }

    window.addEventListener('resize', calculateDuration);

    return () => {
      window.removeEventListener('resize', calculateDuration);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [uniqueItems]);

  // If no live items exist, hide the ticker completely (only return AFTER all hooks execute)
  if (uniqueItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`navbar-ticker-container navbar-ticker--${mode}`}
      role="region"
      aria-label="Live Class & Assignment Notifications"
    >
      {/* Screen reader summary - read only when focused/announced */}
      <span className="sr-only">
        Active notifications: {uniqueItems.map((i) => i.text).join('; ')}
      </span>

      <div ref={viewportRef} className="navbar-ticker-viewport">
        <div
          className="navbar-ticker-track"
          style={{ animationDuration: `${duration}s` }}
        >
          {/* Single notification sequence: each item appears exactly once */}
          <div ref={contentRef} className="navbar-ticker-content">
            {uniqueItems.map((item, idx) => {
              const isLiveClass = item.type === 'live-class';
              const targetPath = isLiveClass ? `/classroom/${item.classId}` : '/assignments';
              const linkState = isLiveClass
                ? null
                : { classId: item.classId, assignmentId: item.assignmentId };

              return (
                <React.Fragment key={item.stableKey}>
                  <Link
                    to={targetPath}
                    state={linkState}
                    className="navbar-ticker-link"
                  >
                    {item.text}
                  </Link>
                  {/* Separator only between items, never trailing */}
                  {idx < uniqueItems.length - 1 && (
                    <span className="navbar-ticker-sep" aria-hidden="true">
                      {' | '}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarTicker;
