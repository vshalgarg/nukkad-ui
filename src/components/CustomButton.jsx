import { Pressable, Text, StyleSheet } from 'react-native';
import globalStyles from '../styles/globalStyles';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

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


const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.diabledText,
    borderColor:Colors.diabledText
  },
});
