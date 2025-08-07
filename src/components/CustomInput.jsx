import React, { forwardRef } from 'react';
import { Text, TextInput, View, Dimensions } from 'react-native';
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
    keyboardType,
    autoCapitalize,
    style,
    autoCorrect,
    placeholder,
    isError = false,
    editable = true,
    autoFocus,
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={styles.input}
          autoFocus={autoFocus}
          underlineColorAndroid="transparent"
          editable={editable}
        />
      </View>
    </View>
  );
});
export default CustomInput;

const styles = ScaledSheet.create({
  wrapper: {
    marginBottom: '12@vs',
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
    borderRadius: '50@ms',
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
});
