
import React from 'react';
import { Loader2 } from 'lucide-react';
import './modalStyle.css';

const LoadingSpinner = ({ message = 'Loading...', size = 32 }) => {
  return (
    <div className="loading-spinner">
      <Loader2
        size={size}
        className="loading-spinner-icon"
        color="var(--primary-blue)"
      />

      <span className="loading-spinner-message">
        {message}
      </span>
    </div>
  );
};

export default LoadingSpinner;
