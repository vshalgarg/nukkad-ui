
import React, { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  const showDialog = (config) => {
    setDialogConfig(config);
    setIsOpen(true);
  };

  const hideDialog = () => {
    setIsOpen(false);
  };
  const value = {
    isOpen,
    dialogConfig,
    showDialog,
    hideDialog
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};