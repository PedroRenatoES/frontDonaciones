import { useState, useCallback } from 'react';

export const useConfirmModal = () => {
  const [modalState, setModalState] = useState({
    show: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = useCallback(({
    title = 'Confirmar acción',
    message,
    type = 'confirm',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, show: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const showAlert = useCallback(({
    title = 'Información',
    message,
    type = 'alert',
    confirmText = 'Aceptar'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        type,
        confirmText,
        cancelText: '',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, show: false }));
          resolve(false);
        }
      });
    });
  });

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, show: false }));
  }, []);

  return {
    modalState,
    showConfirm,
    showAlert,
    hideModal
  };
};
