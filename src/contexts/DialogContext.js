// contexts/DialogContext.js
import React, { createContext, useContext, useState } from 'react';

// Create the context
const DialogContext = createContext();

// Create a provider component
export const DialogProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  // Function to show dialog
  const showDialog = (config) => {
    setDialogConfig(config);
    setIsOpen(true);
  };

  // Function to hide dialog
  const hideDialog = () => {
    setIsOpen(false);
  };

  // Value that will be available to all components
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

// Custom hook to use the dialog context
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};