import React, { useEffect } from 'react';

function Toast({ show, type = 'info', message = '', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show || !message) return null;

  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

export default Toast;


