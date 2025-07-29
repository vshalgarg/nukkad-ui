import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
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

export default function App() {
  useEffect(() => {
    const setupFCM = async () => {
      await notifee.requestPermission();

      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        // Send token to backend
      }
    };

    setupFCM();

    // Foreground messages
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message (foreground):', remoteMessage);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || 'You have a new message',
        android: {
          channelId: 'default',
          smallIcon: 'ic_notification',
          importance: AndroidImportance.HIGH,
        },
      });
    });

    // Background messages (handled automatically unless it's a data-only message)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background:', remoteMessage);
      // Only needed for data-only messages
    });

    // App opened from background via notification
    const unsubscribeOnOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Notification opened from background:', remoteMessage);
        // Navigate or do something
      },
    );

    // App opened from quit (cold start) via notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);
          // Navigate or do something
        }
      });

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
          </StorekeeperProfileProvider>
        </PersistGate>
      </Provider>
    </AuthProvider>
  );
}
