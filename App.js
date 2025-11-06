import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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
import { SearchProvider } from './src/contexts/searchContext';
import { DialogProvider } from './src/contexts/DialogContext';
import GlobalDialog from './src/components/GlobalDialog';
import RNBootSplash from 'react-native-bootsplash';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
    title: remoteMessage.data?.title || 'New Message',
    body: remoteMessage.data?.body,
    android: {
      channelId: 'default',
      smallIcon: 'ic_notification',
      color: '#FF0000',
      pressAction: { id: 'default', launchActivity: 'default' },
      sound: 'default',
    },
    data: remoteMessage.data,
  });

  return Promise.resolve();
});

const AppContent = () => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
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
            pressAction: { id: 'default', launchActivity: 'default' },
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
              pressAction: { id: 'default', launchActivity: 'default' },
            },
            data: remoteMessage.data,
          });
        }
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpened();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      <NavigationContainer
        onReady={() => {
          // ✅ Hide bootsplash only when RN navigation is ready
          RNBootSplash.hide({ fade: true });
        }}
      >
        <AppNavigator />
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
                    <StoreProvider>
                      <AddressProvider>
                        <StorekeeperAddressProvider>
                          <AppContent />
                          <GlobalDialog />
                        </StorekeeperAddressProvider>
                      </AddressProvider>
                    </StoreProvider>
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
