import React, { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCustomerProfile } from '../services/customer/profileService';
import { getStorekeeperProfile } from '../services/storekeeper/storekeeperProfileService';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('role');
        console.log('Splash: Token:', token, 'Role:', role);

        if (!token) {
          navigation.replace('Home');
          return;
        }

        if (role === 'STOREKEEPER') {
          try {
            const res = await getStorekeeperProfile(token);
            navigation.replace('StorekeeperDashboard');
          } catch (err) {
            if (err?.response?.data?.responseCode === 1009) {
              navigation.replace('StorekeeperCreateProfile');
            } else {
              navigation.replace('Home');
            }
          }
        } else if (role === 'CUSTOMER') {
          try {
            const res = await getCustomerProfile(token);
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
        console.log('Auth check failed', e);
        navigation.replace('Home');
      }
    };

    checkSession();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
};

export default SplashScreen;
