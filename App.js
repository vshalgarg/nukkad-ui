import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, ActivityIndicator } from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
import { SearchProvider } from './src/contexts/searchContext';

import { DialogProvider } from './src/contexts/DialogContext';
import GlobalDialog from './src/components/GlobalDialog';

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

//  🔒 FIX: Use in a component wrapped in SafeAreaProvider
const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const role = await AsyncStorage.getItem('role');
        console.log('token', token, 'role', role);
        if (token) {
          if (role === 'STOREKEEPER') setInitialRoute('StorekeeperDashboard');
          else setInitialRoute('CustomerDashboard');
        } else {
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setInitialRoute('Home');
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const setupFCM = async () => {
      try {
        await notifee.requestPermission();
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
          });
        }

        const token = await messaging().getToken();
        await AsyncStorage.setItem('FcmToken', token);
        console.log('FCM Token:', token);
      } catch (error) {
        console.error('FCM Setup Error:', error);
      }
    };

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      try {
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

    const unsubscribeOnOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Notification opened from background:', remoteMessage);
      },
    );

    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
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
        }
      });

    setupFCM();

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpened();
    };
  }, []);
  // ⏳ Loader while checking auth
  if (!initialRoute) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <StatusBar backgroundColor="white" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <NavigationContainer>
        <AppNavigator initialRoute={initialRoute} />
      </NavigationContainer>
      <Toast config={toastConfig} topOffset={insets.top + 10} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <DialogProvider>
              <StorekeeperProfileProvider>
                <ProfileProvider>
                  <SearchProvider>
                    <AddressProvider>
                      <StoreProvider>
                        <StorekeeperAddressProvider>
                          <AppContent />
                          <GlobalDialog />
                        </StorekeeperAddressProvider>
                      </StoreProvider>
                    </AddressProvider>
                  </SearchProvider>
                </ProfileProvider>
              </StorekeeperProfileProvider>
            </DialogProvider>
          </PersistGate>
        </Provider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
