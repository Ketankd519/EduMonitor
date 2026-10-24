
import React from 'react';
import './modalStyle.css';

const EmptyState = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>

      <h3 className="empty-state-title">
        {title}
      </h3>

      <p className="empty-state-description">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="empty-state-action"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
