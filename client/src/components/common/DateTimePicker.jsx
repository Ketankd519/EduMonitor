import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X } from 'lucide-react';

/**
 * Format a Date object or ISO/datetime-local string into human-friendly string
 */
export function formatDateTimeDisplay(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Converts a Date or ISO string into "YYYY-MM-DDTHH:mm" for input parsing
 */
function toLocalParts(dateVal) {
  if (!dateVal) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
    };
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
    };
  }
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  minDate = null,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedDate, setStagedDate] = useState('');
  const [stagedTime, setStagedTime] = useState('');
  const [error, setError] = useState('');

  // Sync staged state whenever modal opens or confirmed value changes
  useEffect(() => {
    const parts = toLocalParts(value);
    setStagedDate(parts.date);
    setStagedTime(parts.time);
    setError('');
  }, [value, isOpen]);

  const handleOpen = () => {
    const parts = toLocalParts(value);
    setStagedDate(parts.date);
    setStagedTime(parts.time);
    setError('');
    setIsOpen(true);
  };

  const handleCancel = () => {
    // Discard any staged changes and close
    const parts = toLocalParts(value);
    setStagedDate(parts.date);
    setStagedTime(parts.time);
    setError('');
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (!stagedDate || !stagedTime) {
      setError('Please choose both a valid date and time.');
      return;
    }

    const isoLocal = `${stagedDate}T${stagedTime}`;
    const testDate = new Date(isoLocal);
    if (isNaN(testDate.getTime())) {
      setError('Invalid date or time selected.');
      return;
    }

    if (minDate) {
      const minD = new Date(minDate);
      if (!isNaN(minD.getTime()) && testDate <= minD) {
        setError(`Must be after ${formatDateTimeDisplay(minDate)}`);
        return;
      }
    }

    onChange(isoLocal);
    setIsOpen(false);
  };

  const displayString = value ? formatDateTimeDisplay(value) : 'Click to select date & time';

  return (
    <div className="datetime-picker-container">
      <label className="assignment-form-label" htmlFor={id}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>

      {/* Confirmed display input triggering modal */}
      <button
        type="button"
        id={id}
        className={`datetime-display-btn ${!value ? 'placeholder' : ''}`}
        onClick={handleOpen}
        aria-haspopup="dialog"
      >
        <span className="datetime-display-text">
          <Calendar size={16} className="datetime-icon" />
          <span>{displayString}</span>
        </span>
        <span className="datetime-action-tag">Set</span>
      </button>

      {/* Confirmation Dialog */}
      {isOpen && (
        <div className="datetime-modal-overlay" onClick={handleCancel}>
          <div
            className="datetime-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`dt-title-${id || label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="datetime-modal-header">
              <h4 id={`dt-title-${id || label}`}>Confirm {label}</h4>
              <button
                type="button"
                className="datetime-modal-close"
                onClick={handleCancel}
                aria-label="Close picker"
              >
                <X size={18} />
              </button>
            </div>

            <div className="datetime-modal-body">
              <div className="datetime-field-group">
                <label className="datetime-field-label">Date</label>
                <div className="datetime-input-wrapper">
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={stagedDate}
                    onChange={(e) => {
                      setStagedDate(e.target.value);
                      setError('');
                    }}
                    className="datetime-native-input"
                  />
                </div>
              </div>

              <div className="datetime-field-group">
                <label className="datetime-field-label">Time</label>
                <div className="datetime-input-wrapper">
                  <Clock size={16} />
                  <input
                    type="time"
                    value={stagedTime}
                    onChange={(e) => {
                      setStagedTime(e.target.value);
                      setError('');
                    }}
                    className="datetime-native-input"
                  />
                </div>
              </div>

              {stagedDate && stagedTime && (
                <div className="datetime-preview-box">
                  <span className="datetime-preview-label">Selected Preview:</span>
                  <strong className="datetime-preview-value">
                    {formatDateTimeDisplay(`${stagedDate}T${stagedTime}`)}
                  </strong>
                </div>
              )}

              {error && <div className="datetime-error-msg">{error}</div>}
            </div>

            <div className="datetime-modal-footer">
              <button
                type="button"
                className="datetime-btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="datetime-btn-confirm"
                onClick={handleConfirm}
              >
                <Check size={16} />
                <span>Confirm &amp; Set</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
