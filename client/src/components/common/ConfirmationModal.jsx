
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <button
          onClick={onCancel}
          className="confirmation-close"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="confirmation-content">
          <div
            className={`confirmation-icon ${
              isDanger ? 'danger' : 'warning'
            }`}
          >
            <AlertTriangle size={24} />
          </div>

          <div className="confirmation-message">
            <h3 className="confirmation-title">{title}</h3>
            <p className="confirmation-description">{message}</p>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            onClick={onCancel}
            className="confirmation-button confirmation-cancel"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`confirmation-button ${
              isDanger
                ? 'confirmation-danger'
                : 'confirmation-confirm'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
