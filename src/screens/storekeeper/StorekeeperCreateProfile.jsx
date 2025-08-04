import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import StoreImageUploader from '../../components/StoreImageUploader';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { showToast } from '../../utils/toastUtils';
import Colors from '../../styles/colors';
import textStyles from '../../styles/textStyles';
import Fonts from '../../styles/font';
import { useAuth } from '../../contexts/authContext';
import { createStorekeeperProfile } from '../../services/storekeeper/storekeeperProfileService';
import { storekeeperProfileSchema } from '../../schema/validation';
import strings from '../../constants/string';

let pressLock = false; // ✅ Global lock to prevent rapid repeat taps

const StorekeeperCreateProfile = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gstNum, setGstNum] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const nameRef = useRef();
  const storeNameRef = useRef();
  const contactNumberRef = useRef();
  const gstRef = useRef();
  const address1Ref = useRef();
  const address2Ref = useRef();
  const landmarkRef = useRef();
  const cityRef = useRef();
  const stateRef = useRef();
  const pincodeRef = useRef();

  const { token } = useAuth();

  const { createStorekeeperProfile } = useStorekeeperProfile();
  const { safePush } = useSafeRouter();

  const handleContinue = useCallback(async () => {
    // setHasTriedSubmit(true);
    console.log('hadleContinue Pressed');
    if (pressLock) return;
    pressLock = true;

    // isSubmittingRef.current = true;
    setIsSubmitting(true);

    const formData = {
      name,
      storeName,
      contactNumber,
      gstNum,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      images,
    };

    const result = storekeeperProfileSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      let message = '';

      for (const err of result.error.errors) {
        const field = err.path[0];
        if (field) fieldErrors[field] = true;
        if (!message) message = err.message;
      }

      setErrors(fieldErrors);
      if (message) {
        showToast('error', message);
        console.log('Zod validation errors:', result.error.format());
      }

      // Auto-focus on the first invalid input
      if (fieldErrors.name) nameRef.current?.focus();
      else if (fieldErrors.storeName) storeNameRef.current?.focus();
      else if (fieldErrors.contactNumber) contactNumberRef.current?.focus();
      else if (fieldErrors.gstNum) gstRef.current?.focus();
      else if (fieldErrors.addressLine1) address1Ref.current?.focus();
      else if (fieldErrors.landmark) landmarkRef.current?.focus();
      else if (fieldErrors.city) cityRef.current?.focus();
      else if (fieldErrors.state) stateRef.current?.focus();
      else if (fieldErrors.pincode) pincodeRef.current?.focus();

      setIsSubmitting(false);
      isSubmittingRef.current = false;
      pressLock = false;
      return;
    }

    // ✅ Proceed with submission
    // const nameParts = name.trim().split(' ');
    // const updatedProfile = {
    //   ...profile,
    //   firstName: nameParts[0],
    //   lastName: nameParts.slice(1).join(' '),
    //   contactNumber,
    //   storeName,
    //   role: 'storekeeper',
    // };

    // const newAddress = {
    //   storeName,
    //   contactNumber,
    //   addressLine1,
    //   addressLine2,
    //   landmark,
    //   city,
    //   pincode,
    // };
    console.log('isSubmitting', isSubmitting);
    console.log('Zod result:', result);
    try {
      console.log('try block called');
      await createStorekeeperProfile(formData, token);
      showToast('success', strings.registeredSuccessfully);
      // setTimeout(() => (pressLock = false), 1500);
      safePush('StorekeeperDashboard');
    } catch (err) {
      console.error('❌ Storekeeper profile error:', err.message);
      showToast('error', strings.failedToCreateProfile);
      state, (pressLock = false);
    } finally {
      console.log('finally');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    name,
    storeName,
    gstNum,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    contactNumber,
    images,
    token,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={innerStyles.createProfileStyling}>
        <Text style={[innerStyles.header, textStyles.subheading]}>
          {strings.myProfile}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 100}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 40,
          }}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        >
          <View style={innerStyles.centerContainer}>
            <View style={[innerStyles.formContainer, { marginTop: 30 }]}>
              <Text style={innerStyles.label}>
                {strings.storekeeperName}{' '}
                <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={nameRef}
                placeholder="Enter Your Name"
                value={name}
                maxLength={30}
                autoCapitalize="words"
                onTextChange={text => {
                  const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                  setName(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      name: /^[A-Za-z\s]{2,}$/.test(cleaned.trim())
                        ? false
                        : true,
                    }));
                  }
                }}
                isError={errors.name}
              />

              <Text style={innerStyles.label}>
                {strings.storeName} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={storeNameRef}
                placeholder="Enter Store Name"
                value={storeName}
                maxLength={30}
                onTextChange={text => {
                  setStoreName(text);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      storeName: text.trim().length > 0 ? false : true,
                    }));
                  }
                }}
                isError={errors.storeName}
              />

              <Text style={innerStyles.label}>
                {strings.mobile} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={contactNumberRef}
                placeholder="Enter Contact Number"
                value={contactNumber}
                keyboardType="phone-pad"
                maxLength={10}
                onTextChange={text => {
                  const cleaned = text.replace(/\D/g, '');
                  setContactNumber(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      contactNumber: cleaned.length === 10 ? false : true,
                    }));
                  }
                }}
                isError={errors.contactNumber}
              />

              <Text style={innerStyles.label}>
                {strings.gst} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={gstRef}
                placeholder="Enter GSTIN Number"
                value={gstNum}
                autoCapitalize="characters"
                onChange={text => setGstNum(text)}
                maxLength={15}
                onTextChange={text => {
                  const upper = text;
                  setGstNum(upper);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      gstNum: upper.length === 15 ? false : true,
                    }));
                  }
                }}
                isError={errors.gstNum}
              />

              <Text style={innerStyles.label}>
                {strings.addressLine1}{' '}
                <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={address1Ref}
                placeholder="Enter Address"
                value={addressLine1}
                maxLength={40}
                onTextChange={text => {
                  const cleaned = text.replace(/[^a-zA-Z0-9\s,\/-]/g, '');
                  setAddressLine1(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      addressLine1: cleaned.trim().length > 0 ? false : true,
                    }));
                  }
                }}
                isError={errors.addressLine1}
              />

              <Text style={innerStyles.label}>{strings.addressLine2}</Text>
              <CustomInput
                ref={address2Ref}
                placeholder="Enter Address Line 2"
                value={addressLine2}
                maxLength={40}
                onTextChange={text =>
                  setAddressLine2(text.replace(/[^a-zA-Z0-9\s,\/-]/g, ''))
                }
              />

              <Text style={innerStyles.label}>
                {strings.landmark} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={landmarkRef}
                placeholder="Enter Landmark"
                value={landmark}
                maxLength={40}
                onTextChange={text => {
                  setLandmark(text);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      landmark: text.trim().length >= 2 ? false : true,
                    }));
                  }
                }}
                isError={errors.landmark}
              />

              <Text style={innerStyles.label}>
                {strings.city} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={cityRef}
                placeholder="Enter City"
                value={city}
                maxLength={40}
                onTextChange={text => {
                  const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                  setCity(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      city: /^[A-Za-z\s]{2,}$/.test(cleaned.trim())
                        ? false
                        : true,
                    }));
                  }
                }}
                isError={errors.city}
              />

              <Text style={innerStyles.label}>
                {strings.state} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={stateRef}
                placeholder="Enter State"
                value={state}
                maxLength={40}
                onTextChange={text => {
                  const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                  setState(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      state: /^[A-Za-z\s]{2,}$/.test(cleaned.trim())
                        ? false
                        : true,
                    }));
                  }
                }}
                isError={errors.state}
              />

              <Text style={innerStyles.label}>
                {strings.pincode} <Text style={innerStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={pincodeRef}
                placeholder="Enter Pincode"
                value={pincode}
                keyboardType="number-pad"
                maxLength={6}
                onTextChange={text => {
                  const cleaned = text.replace(/\D/g, '');
                  setPincode(cleaned);
                  if (hasTriedSubmit) {
                    setErrors(prev => ({
                      ...prev,
                      pincode: /^\d{6}$/.test(cleaned) ? false : true,
                    }));
                  }
                }}
                isError={errors.pincode}
              />
              <Text style={innerStyles.label}>{strings.uploadStoreImage}</Text>
              <StoreImageUploader images={images} setImages={setImages} />

              <View style={innerStyles.buttonWrapper}>
                <CustomButton
                  title={'Continue'}
                  onPress={handleContinue}
                  // disabled={isSubmitting}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const innerStyles = StyleSheet.create({
  createProfileStyling: {
    height: 63,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontWeight: '600',
    color: Colors.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  formContainer: {
    maxWidth: 500,
  },
  label: {
    marginTop: 5,
    marginBottom: 5,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
  },
  mandatory: {
    color: Colors.reject,
  },
  buttonWrapper: {
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
});

export default StorekeeperCreateProfile;
