import React, { useEffect } from 'react';
import {StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
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
import { StorekeeperProfileProvider } from './src/contexts/storeKeeperProfileContext';
import { toastConfig } from './src/utils/toastConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Headless task handler for kill mode (MUST be at top level)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
    title: remoteMessage.data?.title || 'New Message',
    body: remoteMessage.data?.body,
    android: {
      channelId: 'default',
      smallIcon: 'ic_notification',
      color: '#FF0000',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      sound: 'default',
    },
    data: remoteMessage.data,
  });
  return Promise.resolve();
});

// 1. Headless task handler for kill mode (MUST be at top level)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
    title: remoteMessage.data?.title || 'New Message',
    body: remoteMessage.data?.body,
    android: {
      channelId: 'default',
      smallIcon: 'ic_notification',
      color: '#FF0000',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      sound: 'default'
    },
    data: remoteMessage.data
  });
  return Promise.resolve();
});

export default function App() {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        // Request permissions
        await notifee.requestPermission();

        // Create notification channel (Android only)
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
          });
        }

        // Get and log FCM token
        const token = await messaging().getToken();
        await AsyncStorage.setItem('FcmToken', token);
        console.log('FCM Token:', token);
        // Send token to your backend here
      } catch (error) {
        console.error('FCM Setup Error:', error);
      }
    };

    // 2. Foreground message handler (unchanged)
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      try {
        console.log(
          'Foreground FCM Message:',
          JSON.stringify(remoteMessage, null, 2),
        );

        await notifee.displayNotification({
          id: String(Math.random()),
          title: remoteMessage.data?.title || 'New Message',
          body: remoteMessage.data?.body || 'You have a new notification',
          android: {
            channelId: 'default',
            smallIcon: 'ic_notification',
            color: '#FF0000',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            sound: 'default',
          },
          data: remoteMessage.data,
        });
      } catch (error) {
        console.error('Foreground Notification Error:', error);
      }
    });

    // 3. Background message handler (unchanged)
    const unsubscribeOnOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Notification opened from background:', remoteMessage);
        // Handle navigation here if needed
      },
    );

    // 4. Enhanced quit state handler
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log(
            'App opened from quit state via notification:',
            remoteMessage,
          );

          // Recreate notification
          await notifee.displayNotification({
            title: remoteMessage.data?.title || 'New Message',
            body: remoteMessage.data?.body,
            android: {
              channelId: 'default',
              smallIcon: 'ic_notification',
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
            },
            data: remoteMessage.data,
          });

          // Handle navigation here
        }
      });

    // Initialize
    setupFCM();

    // Cleanup
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpened();
    };
  }, []);

  return (
    <AuthProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <StorekeeperProfileProvider>
            <ProfileProvider>
              <AddressProvider>
                <StoreProvider>
                  <StorekeeperAddressProvider>
                    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                      <StatusBar
                        backgroundColor="white"
                        barStyle="dark-content"
                      />
                      <NavigationContainer>
                        <AppNavigator />
                      </NavigationContainer>
                      <Toast config={toastConfig} topOffset={1} />
                    </SafeAreaView>
                  </StorekeeperAddressProvider>
                </StoreProvider>
              </AddressProvider>
            </ProfileProvider>
          </StorekeeperProfileProvider>
        </PersistGate>
      </Provider>
    </AuthProvider>
  );
}
