import { BaseToast, ErrorToast } from 'react-native-toast-message';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

export const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.successToast,
        alignItems: 'center',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        flexDirection: 'column',
        alignItems: 'center',
      }}
      text1Style={{
        fontSize: Fonts.sizes.base,
        fontWeight: '600',
        color: Colors.successToast,
        width: '100%',
      }}
      text2Style={{
        fontSize: Fonts.sizes.sm,
        color: Colors.successToast,
        width: '100%',
      }}
      text2NumberOfLines={2}
    />
  ),

  error: props => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: Colors.errorToast,
        alignItems: 'center',
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        flexDirection: 'column',
        alignItems: 'center',
      }}
      text1Style={{
        fontSize: Fonts.sizes.base,
        fontWeight: 600,
        color: Colors.errorToast,
        width: '100%',
      }}
      text2Style={{
        fontSize: Fonts.sizes.sm,
        color: Colors.errorToast,
        width: '100%',
      }}
      text2NumberOfLines={2}
    />
  ),
};
