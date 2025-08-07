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

let pressLock = false;

const CustomerCreateProfile = () => {
  useBackHandlerControl({ blockBack: true });
  const [name, setName] = useState('');
  const [dob, setDob] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef();
  const emailRef = useRef();
  const addressRef = useRef();
  const landmarkRef = useRef();
  const cityRef = useRef();
  const stateRef = useRef();
  const pincodeRef = useRef();

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

  const formatDateYYYYMMDD = date => {
    if (!(date instanceof Date) || isNaN(date)) return null;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDobChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (event.type === 'dismissed') return; // prevent setting date if dismissed

    const currentDate = selectedDate || dob;
    const today = new Date();

    // Optional: Validate that DOB is not in the future and user is at least 13 years old
    const age = today.getFullYear() - currentDate.getFullYear();
    const isFutureDate = currentDate > today;

    if (isFutureDate || age < 13) {
      setErrors(prev => ({ ...prev, dob: true }));
    } else {
      setDob(currentDate);
      setErrors(prev => ({ ...prev, dob: false }));
    }
  };

  const handleContinue = async () => {
    if (pressLock) return;
    pressLock = true;
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      dob,
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

      // Auto focus first invalid field
      if (fieldErrors.name) nameRef.current?.focus();
      else if (fieldErrors.email) emailRef.current?.focus();
      else if (fieldErrors.addressLine1) addressRef.current?.focus();
      else if (fieldErrors.landmark) landmarkRef.current?.focus();
      else if (fieldErrors.city) cityRef.current?.focus();
      else if (fieldErrors.state) stateRef.current?.focus();
      else if (fieldErrors.pincode) pincodeRef.current?.focus();
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
        role: 'customer',
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={localStyles.createProfileStyling}>
        <Text style={[localStyles.header, textStyles.subheading]}>
          {strings.myProfile}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
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
                />

                <Text style={localStyles.label}>
                  {strings.mobile} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  value={mobile}
                  editable={false}
                  keyboardType="phone-pad"
                  maxLength={10}
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
                />

                <Text style={localStyles.label}>
                  {strings.dob} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <View
                    style={[
                      localStyles.dobInput,
                      errors.dob && { borderColor: Colors.reject },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: Fonts.sizes.base,
                        color: dob ? Colors.secondary : Colors.disabledText,
                      }}
                    >
                      {dob
                        ? dob.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Select Date of Birth'}
                    </Text>
                  </View>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={dob || new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={handleDobChange}
                  />
                )}

                <Text style={localStyles.label}>
                  {strings.addressLine1}
                  <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={addressRef}
                  value={addressLine1}
                  placeholder="Enter Your Address"
                  maxLength={38}
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z0-9\s,\/-]/g, '');
                    setAddressLine1(cleaned);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        addressLine1: cleaned.trim().length > 0 ? false : true,
                      }));
                    }
                  }}
                  isError={errors.addressLine1}
                />

                <Text style={localStyles.label}>{strings.addressLine2}</Text>
                <CustomInput
                  value={addressLine2}
                  placeholder="Enter Address Line 2"
                  onTextChange={text =>
                    setAddressLine2(text.replace(/[^a-zA-Z0-9\s,\/-]/g, ''))
                  }
                  maxLength={38}
                />

                <Text style={localStyles.label}>
                  {strings.landmark}{' '}
                  <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={landmarkRef}
                  value={landmark}
                  placeholder="Enter Landmark"
                  onTextChange={text => {
                    setLandmark(text);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        landmark: text.trim().length >= 2 ? false : true,
                      }));
                    }
                  }}
                  maxLength={20}
                  isError={errors.landmark}
                />

                <Text style={localStyles.label}>
                  {strings.city} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={cityRef}
                  placeholder="Enter City"
                  value={city}
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                    setCity(cleaned);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        city: cleaned.trim().length >= 2 ? false : true,
                      }));
                    }
                  }}
                  maxLength={20}
                  isError={errors.city}
                />

                <Text style={localStyles.label}>
                  {strings.state} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={stateRef}
                  placeholder="Enter State"
                  value={state}
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                    setState(cleaned);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        state: cleaned.trim().length >= 2 ? false : true,
                      }));
                    }
                  }}
                  maxLength={20}
                  isError={errors.state}
                />

                <Text style={localStyles.label}>
                  {strings.pincode} <Text style={localStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={pincodeRef}
                  value={pincode}
                  placeholder="Enter Pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  onTextChange={text => {
                    const cleaned = text.replace(/\D/g, '');
                    setPincode(cleaned);
                    if (isSubmitting) {
                      setErrors(prev => ({
                        ...prev,
                        pincode: /^\d{6}$/.test(cleaned) ? false : true,
                      }));
                    }
                  }}
                  isError={errors.pincode}
                />

                <View style={localStyles.buttonWrapper}>
                  <CustomButton
                    title={strings.continue}
                    onPress={handleContinue}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: '12@s',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: '50@s',
    backgroundColor: Colors.white,
    marginBottom: '9@vs',
    justifyContent: 'center',
  },
  buttonWrapper: {
    marginTop: '40@vs',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30@vs',
  },
});
