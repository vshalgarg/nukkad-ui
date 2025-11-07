import { useState } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDialog } from '../contexts/DialogContext';
import { useProfile } from '../contexts/profileContext';
import { useAddress } from '../contexts/addressContext';
import { useStore } from '../contexts/storeContext';
import { useSafeRouter } from './useSafeRouter';
import { showToast } from '../utils/toastUtils';
import { resetUser } from '../store/userSlice';
import { clearCart } from '../store/cartSlice';
import auth from '@react-native-firebase/auth';

export const useLogout = () => {
  const [loggingOut, setLoggingOut] = useState(false);
  const { showDialog } = useDialog();
  const { safeReplace } = useSafeRouter();
  const dispatch = useDispatch();
  const { resetProfile } = useProfile();
  const { resetAddress } = useAddress();
  const { resetStore } = useStore();

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      await auth().signOut();
      console.log('Firebase user logged out');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('storekeeperProfile');
      await AsyncStorage.clear();
      dispatch(clearCart());
      dispatch(resetUser());
      resetProfile();
      resetAddress();
      resetStore();
      safeReplace('Home');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('error', 'Logout Failed', error?.message || 'Please try again');
      throw error; 
    } finally {
      setTimeout(() => setLoggingOut(false), 100);
    }
  };

  const confirmLogout = () => {
    showDialog({
      title: 'Logout',
      message: 'Are you sure you want to Logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Logout cancelled');
      },
      onConfirm: performLogout,
    });
  };

  return {
    confirmLogout,
    performLogout, 
    loggingOut,
  };
};
