import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBootSplash from 'react-native-bootsplash';
import { getCustomerProfile } from '../services/customer/profileService';
import { getStorekeeperProfile } from '../services/storekeeper/storekeeperProfileService';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('role');

        if (!token) {
          navigation.replace('Home');
          return;
        }

        if (role === 'STOREKEEPER') {
          try {
            await getStorekeeperProfile(token);
            navigation.replace('StorekeeperDashboard');
          } catch (err) {
            console.log('err', err?.data?.responseCode);
            if (err?.data?.responseCode === 1008) {
              navigation.replace('StorekeeperCreateProfile');
            } else {
              navigation.replace('Home');
            }
          }
        } else if (role === 'CUSTOMER') {
          try {
            await getCustomerProfile(token);
            navigation.replace('CustomerDashboard');
          } catch (err) {
            if (err?.response?.data?.responseCode === 1009) {
              navigation.replace('CustomerCreateProfile');
            } else {
              navigation.replace('Home');
            }
          }
        } else {
          navigation.replace('Home');
        }
      } catch (e) {
        navigation.replace('Home');
      } finally {
        setTimeout(() => RNBootSplash.hide({ fade: true }), 300);
      }
    };

    checkSession();
  }, []);

  return null;
};

export default SplashScreen;
