import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { findNodeHandle, UIManager, InteractionManager } from 'react-native';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { useProfile } from '../../contexts/profileContext';
import styles from '../../styles/globalStyles';
import Colors from '../../styles/colors';
import { showToast } from '../../utils/toastUtils';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import textStyles from '../../styles/textStyles';
import { useRoute } from '@react-navigation/native';
import { createCustomerProfile } from '../../services/customer/customerProfileService';
import { useAuth } from '../../contexts/authContext';
import { useDispatch } from 'react-redux';
import Fonts from '../../styles/font';
import useBackHandlerControl from '../../hooks/useBackHandlerControl';
// import { setCartUser } from '../../store/cartSlice';
import { validateCustomerProfile } from '../../schema/validation';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import DatePicker from '../../components/DatePicker';
import StateDropdown from '../../components/StateDropdown';
import CityDropdown from '../../components/CityDropdown';

let pressLock = false;

const CustomerCreateProfile = () => {
  useBackHandlerControl({ blockBack: true });
  const [name, setName] = useState('');
  const [dob, setDob] = useState(null);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [errors, setErrors] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // 'state' | 'city' | null

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const nameRef = useRef();
  const emailRef = useRef();
  const address1ref = useRef();
  const address2ref = useRef();
  const landmarkRef = useRef();
  const cityRef = useRef();
  const stateRef = useRef();
  const pincodeRef = useRef();
  const scrollViewRef = useRef();

  const { token } = useAuth();
  const { createProfile } = useProfile();

  const { safePush } = useSafeRouter();
  const route = useRoute();
  const dispatch = useDispatch();

  const params = route.params || {};

  useEffect(() => {
    if (params.toast) {
      try {
        const { type, title, message } = JSON.parse(params.toast);
        showToast(type, title, message);
      } catch (e) {
        console.warn('Failed to parse toast params', e);
      }
    }
    if (params.mobile) setMobile(params.mobile);
  }, [params]);

  const scrollToInput = ref => {
    if (ref?.current && scrollViewRef?.current?.scrollToFocusedInput) {
      scrollViewRef.current.scrollToFocusedInput(ref.current, 80);
    } else {
      ref?.current?.focus?.();
    }
  };

  const formatDateYYYYMMDD = date => {
    if (!(date instanceof Date) || isNaN(date)) return null;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // const handleDobChange = (event, selectedDate) => {
  //   setShowDatePicker(false);

  //   if (event.type === 'dismissed') return; // prevent setting date if dismissed

  //   const currentDate = selectedDate || dob;
  //   const today = new Date();

  //   // Optional: Validate that DOB is not in the future and user is at least 13 years old
  //   const age = today.getFullYear() - currentDate.getFullYear();
  //   const isFutureDate = currentDate > today;

  //   if (isFutureDate || age < 13) {
  //     setErrors(prev => ({ ...prev, dob: true }));
  //   } else {
  //     setDob(currentDate);
  //     setErrors(prev => ({ ...prev, dob: false }));
  //   }
  // };

  const handleContinue = async () => {
    if (pressLock) return;
    pressLock = true;
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      dob: dob instanceof Date && !isNaN(dob) ? dob : null,
      mobile,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    };

    const { isValid, fieldErrors, message } = validateCustomerProfile(payload);
    

    setErrors(fieldErrors);

    if (!isValid) {
      showToast('error', message);

      if (fieldErrors.name) scrollToInput(nameRef);
      else if (fieldErrors.email) scrollToInput(emailRef);
      // else if (fieldErrors.addressLine1) scrollToInput(address1ref);
      // else if (fieldErrors.landmark) scrollToInput(landmarkRef);
      // else if (fieldErrors.city) scrollToInput(cityRef);
      // else if (fieldErrors.state) scrollToInput(stateRef);
      // else if (fieldErrors.pincode) scrollToInput(pincodeRef);

      pressLock = false;
      return;
    }

    const nameParts = payload.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const formattedPayload = {
      ...payload,
      dob: formatDateYYYYMMDD(payload.dob),
    };

    const newAddress = {
      id: Date.now().toString(),
      name: payload.name,
      addressLine1: payload.addressLine1,
      addressLine2,
      landmark: payload.landmark,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
    };

    try {
      await createCustomerProfile(formattedPayload, token);

      const newProfile = {
        firstName,
        lastName,
        email: payload.email,
        mobile,
        dob: formatDateYYYYMMDD(payload.dob),
        role: 'CUSTOMER',
        image: null,
      };

      await createProfile(newProfile);
      // dispatch(setCartUser(profile.userId));

      showToast('success', strings.registeredSuccessfully);
      Keyboard.dismiss();
      setTimeout(() => {
        pressLock = false;
        safePush('AddStore', { hideBackButton: true });
      }, 100);
    } catch (err) {
      showToast('error', err.message);

      pressLock = false;
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: Colors.white,
          marginBottom: '100@vs',
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 30} // adjust if you have header/navbar
      >
        <View style={localStyles.createProfileStyling}>
          <Text style={[localStyles.header, textStyles.subheading]}>
            {strings.myProfile}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
          }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.pageContainer}>
            <View style={localStyles.centerContainer}>
              <View style={[localStyles.formContainer, { marginTop: 30 }]}>
                <Text style={localStyles.label}>
                  {strings.name} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={nameRef}
                  placeholder="Enter Your Name"
                  value={name}
                  maxLength={35}
                  onFocus={() => setOpenDropdown(null)}
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                    setName(cleaned);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        name:
                          cleaned.trim().length >= 2 &&
                          /^[A-Za-z\s]+$/.test(cleaned)
                            ? false
                            : true,
                      }));
                    }
                  }}
                  autoCapitalize="words"
                  isError={errors.name}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />

                <Text style={localStyles.label}>
                  {strings.mobile} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  value={mobile}
                  editable={false}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setOpenDropdown(null)}
                  style={{ color: Colors.disabledText }}
                  isError={errors.mobile}
                />

                <Text style={localStyles.label}>
                  {strings.email} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={emailRef}
                  placeholder="Enter Your Email"
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setOpenDropdown(null)}
                  onTextChange={text => {
                    setEmail(text);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())
                          ? false
                          : true,
                      }));
                    }
                  }}
                  maxLength={38}
                  isError={errors.email}
                  returnKeyType="next"
                  onSubmitEditing={() => address1ref.current?.focus()}
                />

                <Text style={localStyles.label}>{strings.addressLine1}</Text>
                <CustomInput
                  ref={address1ref}
                  value={addressLine1}
                  placeholder="Enter Your Address"
                  maxLength={38}
                  onFocus={() => setOpenDropdown(null)}
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z0-9\s,\/-]/g, '');
                    setAddressLine1(cleaned);
                    // if (isSubmitting) {
                    //   setErrors(prev => ({
                    //     ...prev,
                    //     addressLine1: cleaned.trim().length > 0 ? false : true,
                    //   }));
                    // }
                  }}
                  isError={errors.addressLine1}
                  returnKeyType="next"
                  onSubmitEditing={() => address2ref.current?.focus()}
                />

                <Text style={localStyles.label}>{strings.addressLine2}</Text>
                <CustomInput
                  ref={address2ref}
                  value={addressLine2}
                  placeholder="Enter Address Line 2"
                  onTextChange={text =>
                    setAddressLine2(text.replace(/[^a-zA-Z0-9\s,\/-]/g, ''))
                  }
                  maxLength={38}
                  onFocus={() => setOpenDropdown(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => landmarkRef.current?.focus()}
                />

                <Text style={localStyles.label}>{strings.landmark} </Text>
                <CustomInput
                  ref={landmarkRef}
                  value={landmark}
                  placeholder="Enter Landmark"
                  onTextChange={text => {
                    setLandmark(text);
                    // if (isSubmitting) {
                    //   setErrors(prev => ({
                    //     ...prev,
                    //     landmark: text.trim().length >= 2 ? false : true,
                    //   }));
                    // }
                  }}
                  maxLength={20}
                  onFocus={() => setOpenDropdown(null)}
                  isError={errors.landmark}
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                />

                <Text style={localStyles.label}>{strings.state}</Text>
                <StateDropdown
                  selectedState={state}
                  onSelectState={val => {
                    setState(val);
                    setCity('');
                  }}
                  error={errors.state}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  dropdownKey="state"
                />

                <Text style={localStyles.label}>{strings.city}</Text>
                <CityDropdown
                  selectedState={state}
                  selectedCity={city}
                  onSelectCity={val => {
                    setCity(val);
                  }}
                  // error={errors.city}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  dropdownKey="city"
                />

                <Text style={localStyles.label}>{strings.pincode}</Text>
                <CustomInput
                  ref={pincodeRef}
                  value={pincode}
                  placeholder="Enter Pincode"
                  keyboardType="number-pad"
                  inputAccessoryViewID="pincode"
                  maxLength={6}
                  onFocus={() => setOpenDropdown(null)}
                  onTextChange={text => {
                    const cleaned = text.replace(/\D/g, '');
                    setPincode(cleaned);
                    // if (isSubmitting) {
                    //   setErrors(prev => ({
                    //     ...prev,
                    //     pincode: /^\d{6}$/.test(cleaned) ? false : true,
                    //   }));
                    // }
                  }}
                  isError={errors.pincode}
                />
                <Text style={localStyles.label}>
                  {strings.dob} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <View
                  style={[
                    localStyles.dobInput,
                    errors.dob && {
                      borderColor: Colors.reject,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <DatePicker
                    dob={dob}
                    setDob={date => {
                      Keyboard.dismiss();
                      setDob(date);
                      if (date instanceof Date && !isNaN(date.getTime())) {
                        setErrors(prev => ({ ...prev, dob: false }));
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {!isKeyboardVisible && (
        <View style={localStyles.buttonWrapper}>
          <CustomButton title={strings.continue} onPress={handleContinue} />
        </View>
      )}
    </View>
  );
};

export default CustomerCreateProfile;

const localStyles = ScaledSheet.create({
  createProfileStyling: {
    height: '63@vs',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontWeight: '600',
    color: Colors.white,
    fontSize: '16@s',
  },
  centerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  formContainer: {
    maxWidth: '500@s',
    paddingHorizontal: '20@s',
  },
  label: {
    marginTop: '5@vs',
    marginBottom: '5@vs',
    fontWeight: '500',
    color: Colors.secondary,
    fontSize: '14@s',
  },
  mandatory: {
    color: Colors.reject,
  },
  dobInput: {
    height: '40@vs',
    paddingHorizontal: '20@s',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: '50@s',
    backgroundColor: Colors.white,
    marginBottom: '9@vs',
    justifyContent: 'center',
  },
  buttonWrapper: {
    paddingVertical: '10@vs',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
