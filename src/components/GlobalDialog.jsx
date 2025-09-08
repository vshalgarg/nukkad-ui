// components/GlobalDialog.js
import React from 'react';
import { useDialog } from '../contexts/DialogContext';
import ConfirmDialog from './ConfirmDialog';

const GlobalDialog = () => {
  const { isOpen, dialogConfig, hideDialog } = useDialog();

  const handleConfirm = () => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm();
    }
    hideDialog();
  };

  const handleCancel = () => {
    if (dialogConfig.onCancel) {
      dialogConfig.onCancel();
    }
    hideDialog();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={dialogConfig.title}
      message={dialogConfig.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirm={dialogConfig.confirmText}
      cancel={dialogConfig.cancelText}
    />
  );
};

export default GlobalDialog;
