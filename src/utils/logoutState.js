// utils/logoutState.js
let isLoggingOut = false;

export const setLoggingOut = value => {
  isLoggingOut = value;
};

export const getLoggingOut = () => isLoggingOut;
