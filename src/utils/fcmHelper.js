import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const setupAndStoreFcmToken = async () => {
  try {
    // Ask permission
    await notifee.requestPermission();

    // Create Android channel if needed
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }

    // Get FCM token
    const token = await messaging().getToken();

    if (token) {
      const prevToken = await AsyncStorage.getItem('FcmToken');
      if (prevToken !== token) {
        await AsyncStorage.setItem('FcmToken', token);
        console.log(' New FCM Token stored:', token);
      } else {
        console.log(' FCM Token unchanged:', token);
      }
    }
  } catch (error) {
    console.error(' setupAndStoreFcmToken Error:', error);
  }
};
