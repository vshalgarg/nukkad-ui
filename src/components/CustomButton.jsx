import { Pressable, Text, StyleSheet } from 'react-native';
import globalStyles from '../styles/globalStyles';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';

export default function Button({ title, onPress, style, textStyle,disabled=false }) {
  return (
    <Pressable
      onPress={!disabled ? onPress : null}
      style={[
        globalStyles.allBtn,
        styles.button,
        style,
        disabled ? styles.disabledButton : null,
      ]}
    >
      <Text
        style={[styles.buttonText, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    </Pressable>
  );
}


const styles = ScaledSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: '10@s',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    textAlignVertical: 'center',
    flexShrink: 1, 
  },
  disabledButton: {
    backgroundColor: Colors.disabledText,
    borderColor: Colors.disabledText,
  },
});