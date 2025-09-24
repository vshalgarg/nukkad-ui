import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { findNodeHandle, UIManager, InteractionManager } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
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
import { ScaledSheet } from 'react-native-size-matters';
import useBackHandlerControl from '../../hooks/useBackHandlerControl';
import StateDropdown from '../../components/StateDropdown';
import CityDropdown from '../../components/CityDropdown';
import useKeyboardStatus from '../../hooks/useKeyboardStatus';

let pressLock = false; // ✅ Global lock to prevent rapid repeat taps

const StorekeeperCreateProfile = () => {
  const isKeyboardVisible = useKeyboardStatus();

  useBackHandlerControl({ blockBack: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
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
  const scrollViewRef = useRef();
  const { token } = useAuth();
  const { createStorekeeperProfile } = useStorekeeperProfile();
  const { safePush } = useSafeRouter();
  const route = useRoute();
  const { toast } = route.params || {};
  const headerHeight = useHeaderHeight();
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
    if (params.mobile) setContactNumber(params.mobile);
  }, [params]);

  const scrollToInput = ref => {
    if (ref?.current && scrollViewRef?.current) {
      const inputHandle = findNodeHandle(ref.current);
      const scrollHandle = findNodeHandle(scrollViewRef.current);

      if (inputHandle && scrollHandle) {
        InteractionManager.runAfterInteractions(() => {
          UIManager.measureLayout(
            inputHandle,
            scrollHandle,
            error => {
              console.log('measureLayout error:', error);
            },
            (x, y) => {
              scrollViewRef.current.scrollTo({ y: y - 40, animated: true });
              ref.current.focus?.(); // safer optional chaining
            },
          );
        });
      }
    }
  };
  const handleContinue = useCallback(async () => {
    setHasTriedSubmit(true);
    console.log('hadleContinue Pressed');
    if (pressLock) return;
    pressLock = true;
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
      imageUrls: images
        .filter(img => img && img.status === 'uploaded' && img.remoteUrl)
        .map(img => img.remoteUrl),
    };

    const result = storekeeperProfileSchema.safeParse(formData);

    console.log(result);
    if (!result.success) {
      const fieldErrors = {};
      let message = '';

      for (const err of result.error.errors) {
        const field = err.path[0];
        if (field) fieldErrors[field] = true;
        if (!message) message = err.message;
      }

      if (!state) fieldErrors.state = true;
      if (!city) fieldErrors.city = true;

      setErrors(fieldErrors);

      if (message) {
        showToast('error', message);
        console.log('Zod validation errors:', result.error.format());
      }

      // Auto-scroll
      if (fieldErrors.name) scrollToInput(nameRef);
      else if (fieldErrors.storeName) scrollToInput(storeNameRef);
      else if (fieldErrors.contactNumber) scrollToInput(contactNumberRef);
      else if (fieldErrors.gstNum) scrollToInput(gstRef);
      else if (fieldErrors.addressLine1) scrollToInput(address1Ref);
      else if (fieldErrors.landmark) scrollToInput(landmarkRef);
      else if (fieldErrors.state)
        scrollToInput(stateRef); // Optional: assign a ref to state
      else if (fieldErrors.city)
        scrollToInput(cityRef); // Optional: assign a ref to city
      else if (fieldErrors.pincode) scrollToInput(pincodeRef);

      setIsSubmitting(false);
      isSubmittingRef.current = false;
      pressLock = false;
      return;
    }

    console.log('isSubmitting', isSubmitting);
    console.log('Zod result:', result);
    try {
      console.log('try block called');
      await createStorekeeperProfile(formData, token);
      showToast('success', strings.registeredSuccessfully);
      setTimeout(() => (pressLock = false), 1500);
      safePush('StorekeeperDashboard');
    } catch (err) {
      console.error('Storekeeper profile error:', err.message);
      showToast('error', strings.failedToCreateProfile);
      pressLock = false;
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

  useEffect(() => {
    console.log(toast);
    if (toast) {
      try {
        const parsedToast = JSON.parse(toast);
        showToast(parsedToast.type, parsedToast.title);
      } catch (e) {
        console.warn('⚠️ Failed to parse toast:', e.message);
      }
    }
  }, []);

  return (
    <View style={[{ flex: 1, backgroundColor: Colors.white }]}>
      <View style={innerStyles.createProfileStyling}>
        <Text style={[innerStyles.header, textStyles.subheading]}>
          {strings.myProfile}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[innerStyles.centerContainer]}>
            <View style={[innerStyles.formContainer, { marginTop: 30 }]}>
              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.storekeeperName}{' '}
                  <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={nameRef}
                  placeholder="Enter Your Name"
                  value={name}
                  // style={{ width: '100%' }}
                  maxLength={30}
                  onFocus={() => setOpenDropdown(null)}
                  autoCapitalize="words"
                  onTextChange={text => {
                    const cleaned = text.replace(/[^a-zA-Z\s]/g, '');
                    setName(cleaned);
                    if (hasTriedSubmit) {
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
                  isError={errors.name}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => storeNameRef.current?.focus()}
                />
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.storeName}{' '}
                  <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={storeNameRef}
                  placeholder="Enter Store Name"
                  value={storeName}
                  // style={{ width: '100%' }}
                  maxLength={30}
                  onFocus={() => setOpenDropdown(null)}
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => contactNumberRef.current?.focus()}
                />
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.mobile} <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={contactNumberRef}
                  placeholder="Enter Contact Number"
                  // style={{ width: '100%' }}
                  value={contactNumber}
                  onFocus={() => setOpenDropdown(null)}
                  keyboardType="number-pad"
                  inputAccessoryViewID="contactnumber"
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
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.gst} <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={gstRef}
                  placeholder="Enter GSTIN Number"
                  value={gstNum}
                  // style={{ width: '100%' }}
                  autoCapitalize="characters"
                  onChange={text => setGstNum(text)}
                  maxLength={15}
                  onFocus={() => setOpenDropdown(null)}
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => address1Ref.current?.focus()}
                />
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.addressLine1}{' '}
                  <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={address1Ref}
                  placeholder="Enter Address"
                  // style={{ width: '100%' }}
                  value={addressLine1}
                  maxLength={40}
                  onFocus={() => setOpenDropdown(null)}
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => address2Ref.current?.focus()}
                />
              </View>
              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>{strings.addressLine2}</Text>
                <CustomInput
                  ref={address2Ref}
                  placeholder="Enter Address Line 2"
                  // style={{ width: '100%' }}
                  value={addressLine2}
                  maxLength={40}
                  onFocus={() => setOpenDropdown(null)}
                  onTextChange={text =>
                    setAddressLine2(text.replace(/[^a-zA-Z0-9\s,\/-]/g, ''))
                  }
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => landmarkRef.current?.focus()}
                />
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.landmark}{' '}
                  <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={landmarkRef}
                  placeholder="Enter Landmark"
                  // style={{ width: '100%' }}
                  value={landmark}
                  maxLength={40}
                  onFocus={() => setOpenDropdown(null)}
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
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => cityRef.current?.focus()}
                />
              </View>

              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.state} <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <StateDropdown
                  selectedState={state}
                  onSelectState={val => {
                    setState(val);
                    setCity(''); // Reset city when state changes
                    setErrors(prev => ({
                      ...prev,
                      state: val ? false : true,
                      city: true, // since city is reset
                    }));
                  }}
                  error={errors.state}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  dropdownKey="state"
                />
              </View>
              {console.log(state)}
              {/* City */}
              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.city} <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CityDropdown
                  selectedState={state}
                  selectedCity={city}
                  onSelectCity={val => {
                    setCity(val);
                    setErrors(prev => ({
                      ...prev,
                      city: val ? false : true,
                    }));
                  }}
                  error={errors.city}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  dropdownKey="city"
                />

                {/* <Text style={formStyles.label}>
              {strings.state} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={stateRef}
              placeholder="Enter Your State"
              value={state}
              maxLength={20}
              autoCapitalize="sentences"
              onTextChange={text => {
                setState(text);
                if (errors.state && text.trim().length > 0) {
                  setErrors(prev => ({ ...prev, state: false }));
                }
              }}
              isError={errors.state}
            /> */}
              </View>
              <View style={innerStyles.inputContainer}>
                <Text style={innerStyles.label}>
                  {strings.pincode} <Text style={innerStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={pincodeRef}
                  placeholder="Enter Pincode"
                  value={pincode}
                  // style={{ width: '100%' }}
                  keyboardType="number-pad"
                  inputAccessoryViewID="pincode"
                  maxLength={6}
                  onFocus={() => setOpenDropdown(null)}
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
              </View>

              <View style={innerStyles.imageContainer}>
                <Text style={innerStyles.label}>
                  {strings.uploadStoreImage}
                </Text>
              </View>
              <StoreImageUploader images={images} setImages={setImages} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {!isKeyboardVisible && (
        <View style={innerStyles.buttonWrapper}>
          <CustomButton
            title={'Continue'}
            onPress={handleContinue}
            style={innerStyles.continueBtn}
            // disabled={isSubmitting}
          />
        </View>
      )}
    </View>
  );
};

const innerStyles = ScaledSheet.create({
  createProfileStyling: {
    height: '63@ms',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontWeight: '600',
    color: Colors.white,
    fontSize: Fonts.sizes.lg, // or use '18@ms' if not using Fonts
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: '10@s',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageContainer: {
    marginTop: '20@vs',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    // backgroundColor:"black"
  },
  formContainer: {
    //maxWidth: '500@ms0.3', // smaller scaling factor to prevent extreme width
    width: '80%',
    // backgroundColor:'red'
  },
  label: {
    alignSelf: 'flex-start',
    marginTop: '5@vs',
    marginBottom: '5@vs',
    fontSize: Fonts.sizes.base, // Assuming this is already scaled
    fontWeight: '500',
    color: Colors.secondary,
  },
  mandatory: {
    color: Colors.reject,
  },
  buttonWrapper: {
    // marginTop: '30@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10@ms',
    backgroundColor: Colors.white,
    fontSize: 120,
  },
  continueBtn: {
    width: '80%',
    height: 50,
    borderRadius: 50,
  },
});
export default StorekeeperCreateProfile;
