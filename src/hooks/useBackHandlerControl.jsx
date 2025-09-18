import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDialog } from '../contexts/DialogContext';

export default function useBackHandlerControl({
  blockBack = false,
  confirmBack = false,
} = {}) {
  const navigation = useNavigation();
  const { showDialog } = useDialog();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (blockBack) return true;

        if (confirmBack) {
          showDialog({
            title: 'Exit App',
            message: 'Are you sure you want to exit?',
            confirmText: 'Exit',
            cancelText: 'Cancel',
            onCancel: () => {
              console.log('Exit cancelled');
            },
            onConfirm: () => {
              BackHandler.exitApp(); // Android only
            },
          });
          return true; // prevent default
        }

        return false; // allow default
      };

      // Android back handler
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      
      const beforeRemove = navigation.addListener('beforeRemove', e => {
        if (blockBack) {
          e.preventDefault();
          return;
        }

        if (confirmBack) {
          e.preventDefault();

          showDialog({
            title: 'Exit App',
            message: 'Are you sure you want to exit?',
            confirmText: 'Exit',
            cancelText: 'Cancel',
            onCancel: () => {
              console.log('Exit cancelled');
            },
            onConfirm: () => {
              if (Platform.OS === 'android') {
                BackHandler.exitApp(); // Android only
              } else {
                navigation.dispatch(e.data.action); // iOS: perform the original back navigation
              }
            },
          });
        }
      });

      return () => {
        backHandler.remove();
        beforeRemove(); // remove listener
      };
    }, [blockBack, confirmBack, navigation]),
  );
}
