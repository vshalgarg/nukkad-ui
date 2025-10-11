// hooks/useKeyboardStatus.js
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export default function useKeyboardStatus() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    let hideTimeout;

    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      // optional: clear hideTimeout if keyboard shows again quickly
      if (hideTimeout) clearTimeout(hideTimeout);
      setKeyboardVisible(true);
    });

    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      hideTimeout = setTimeout(() => {
        setKeyboardVisible(false);
      }, 150);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
      if (hideTimeout) clearTimeout(hideTimeout); 
    };
  }, []);

  return isKeyboardVisible;
}
