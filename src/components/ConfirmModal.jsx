import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
  show, 
  title = "Confirmar acción", 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Aceptar", 
  cancelText = "Cancelar",
  type = "confirm" // "confirm", "alert", "success", "error"
}) => {
  if (!show) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'alert':
        return 'confirm-modal-alert';
      case 'success':
        return 'confirm-modal-success';
      case 'error':
        return 'confirm-modal-error';
      default:
        return 'confirm-modal-default';
    }
  };

  return (
    <div className="confirm-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`confirm-modal ${getTypeClass()}`}>
        <div className="confirm-modal-header">
          <span className="confirm-modal-icon">{getIcon()}</span>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>
        
        <div className="confirm-modal-footer">
          {type === 'confirm' && (
            <button 
              className="confirm-modal-btn confirm-modal-btn-cancel" 
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="confirm-modal-btn confirm-modal-btn-confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
