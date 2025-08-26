import { clearCart } from '../../src/store/cartSlice.js';
import { useDialog } from '../../src/contexts/DialogContext.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetUser } from '../../src/store/userSlice.js';
import { useProfile } from '../../src/contexts/profileContext.js';
import { useDispatch } from 'react-redux';

export const setLoggingOut = value => {
  
};

export const getLoggingOut = () => isLoggingOut;
