import React, { forwardRef } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Text,
  TextInput,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import Flag from '../../assets/images/flag.svg';
import Colors from '../styles/colors.js';
import Fonts from '../styles/font.js';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CustomInput = forwardRef(function CustomInput(
  {
    isCountryCode,
    value = '',
    fixedPrefix = '',
    onTextChange,
    maxLength,
    keyboardType = 'default',
    autoCapitalize,
    style,
    autoCorrect,
    placeholder,
    isError = false,
    editable = true,
    autoFocus,
    inputAccessoryViewID, // default ID for InputAccessoryView
    ...props
  },
  ref,
) {
  const inputOnly = value.startsWith(fixedPrefix)
    ? value.slice(fixedPrefix.length)
    : '';

  const handleChangeText = text => {
    const newText = fixedPrefix + text;
    onTextChange(newText);
  };

  const actualKeyboardType = keyboardType || 'default';

  // Show Done button only on iOS and when keyboardType is number-pad
  // Show Done button only on iOS and when keyboardType is number-pad
  const showDoneButton =
    Platform.OS === 'ios' &&
    actualKeyboardType === 'number-pad' &&
    !!inputAccessoryViewID;

  return (
    <View style={styles.wrapper}>
      {isCountryCode && (
        <View style={styles.countryCodeContainer}>
          <Flag />
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isCountryCode && styles.inputWithCountryCode,
          style,
          isError && { borderColor: Colors.reject, borderWidth: 1.5 },
        ]}
      >
        <Text style={styles.fixedPrefix}>{fixedPrefix}</Text>

        <TextInput
          ref={ref}
          {...props}
          value={inputOnly}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.secondaryText}
          maxLength={maxLength ? maxLength - fixedPrefix.length : undefined}
          keyboardType={actualKeyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={styles.input}
          autoFocus={autoFocus}
          underlineColorAndroid="transparent"
          editable={editable}
          inputAccessoryViewID={
            showDoneButton ? inputAccessoryViewID : undefined
          }
        />
      </View>

      {showDoneButton && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.accessory}>
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
});

export default CustomInput;

const styles = ScaledSheet.create({
  wrapper: {
    // marginBottom: '12@vs',
  },
  countryCodeContainer: {
    position: 'absolute',
    left: '12@ms',
    top: '50%',
    transform: [{ translateY: -12 }],
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  countryCodeText: {
    marginLeft: '5@ms',
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    textAlignVertical: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 50,
    height: '40@vs',
    paddingHorizontal: '15@ms',
    backgroundColor: Colors.white,
    width: SCREEN_WIDTH * 0.75,
  },
  fixedPrefix: {
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
    marginRight: '5@ms',
  },
  input: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  inputWithCountryCode: {
    paddingLeft: '70@ms',
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    textAlignVertical: 'center',
  },
  accessory: {
    backgroundColor: Colors.white,
    alignItems: 'flex-end',
    padding: '4@ms',
    borderTopWidth: 0.2,
    borderColor: Colors.secondary,
  },
  doneButton: {
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
  },
  doneButtonText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
});
