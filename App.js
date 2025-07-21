import React, { useEffect } from 'react';
import { Alert, Platform, SafeAreaView } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import AppNavigator from './src/navigation/AppNavigator';
import { store, persistor } from './src/store/store';

import { AuthProvider } from './src/contexts/authContext';
import { ProfileProvider } from './src/contexts/profileContext';
import { StoreProvider } from './src/contexts/storeContext';
import { AddressProvider } from './src/contexts/addressContext';
import { StorekeeperAddressProvider } from './src/contexts/storekeeperAddressContext';

import { toastConfig } from './src/utils/toastConfig';

export default function App() {
  useEffect(() => {
    messaging()
      .requestPermission()
      .then(authStatus => {
        if (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        ) {
          // Get the device token
          messaging()
            .getToken()
            .then(token => {
              console.log('FCM Token:', token);
              // Send this token to your backend if needed
            });
        }
      });

    // Listen for foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message Data:', remoteMessage.data);
      // Show a local notification, update UI, etc.
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    return unsubscribe;
  }, []);
  return (
    <AuthProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ProfileProvider>
            <AddressProvider>
              <StoreProvider>
                <StorekeeperAddressProvider>
                  <SafeAreaView style={{ flex: 1 }}>
                    <NavigationContainer>
                      <AppNavigator />
                    </NavigationContainer>
                    <Toast config={toastConfig} topOffset={2} />
                  </SafeAreaView>
                </StorekeeperAddressProvider>
              </StoreProvider>
            </AddressProvider>
          </ProfileProvider>
        </PersistGate>
      </Provider>
    </AuthProvider>
  );
}
