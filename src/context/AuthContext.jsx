// src/context/AuthContext.js
import { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { validateLogin } from '../utils/Validator';
import { toast } from 'react-toastify';
import { authService } from '../services/AuthService';

export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  submitting: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const login = useCallback(async (formData) => {
    try {
      setSubmitting(true);

      // Client-side validation
      const validationErrors = validateLogin(formData);
      if (Object.keys(validationErrors).length > 0) {
        toast.error('Please fix the errors!', { position: 'top-right' });
        return { errors: validationErrors };
      }
      console.log('Attempting login with:', formData.email); // Debug
      // Call API
      const result = await authService.login(formData);
      console.log('Login successful:'); // Debug
      if (!result.token) {
        throw new Error('No token received from server');
      }
      // Save token and user details in localStorage
      localStorage.setItem('token', result.token);
      setUser(result.user);

      toast.success('Login successful!', { position: 'top-right' });
      return { errors: {} };

    } catch (error) {
      console.error('Login failed:', error); // Debug
      const msg = error.message || 'Login failed. Please try again.';
      toast.error(msg, { position: 'top-right' });
      return { errors: { general: msg } };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    toast.info('Logged out successfully.', { position: 'top-right' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, submitting }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
