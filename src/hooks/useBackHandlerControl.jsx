import { useCallback } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLoggingOut } from '../utils/logoutState';

export default function useBackHandlerControl({
  blockBack = false,
  confirmBack = false,
} = {}) {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (blockBack) return true;

        if (confirmBack && !getLoggingOut()) {
          Alert.alert('Exit App', 'Are you sure you want to exit?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]);
          return true;
        }

        return false; // allow default back
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [blockBack, confirmBack]),
  );
}
