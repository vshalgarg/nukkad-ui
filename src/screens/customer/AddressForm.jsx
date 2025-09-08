import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Alert,
  Text,
  StyleSheet,
} from 'react-native';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { useAddress } from '../../contexts/addressContext';
import { useNavigation } from '@react-navigation/native';
import Fonts from '../../styles/font';
import { showToast } from '../../utils/toastUtils';
import Colors from '../../styles/colors';
import { useRef } from 'react';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { findNodeHandle, UIManager, InteractionManager } from 'react-native';
import StateDropdown from '../../components/StateDropdown';
import CityDropdown from '../../components/CityDropdown';

const AddressForm = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'state' | 'city' | null

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    mode,
    addressData,
    addAddress,
    updateAddress,
    setAddressData,
    setMode,
  } = useAddress();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const mobileRef = useRef(null);
  const address1Ref = useRef(null);
  const landmarkRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const pincodeRef = useRef(null);
  const scrollViewRef = useRef();

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
              scrollViewRef.current
                .getScrollResponder()
                .scrollTo({ y: y - 40, animated: true });

              setTimeout(() => {
                ref.current.focus?.();
              }, 300);
            },
          );
        });
      }
    }
  };
  useEffect(() => {
    if (mode === 'edit' && addressData) {
      setName(addressData.name || '');
      setAddress1(addressData.addressLine1 || '');
      setMobile(addressData.mobileNumber || '');
      setAddress2(addressData.addressLine2 || '');
      setLandmark(addressData.landmark || '');
      setCity(addressData.city || '');
      setState(addressData.state || '');
      setPincode(addressData.pincode || '');
    } else {
      setName('');
      setAddress1('');
      setAddress2('');
      setLandmark('');
      setCity('');
      setState('');
      setPincode('');
    }
  }, [mode, addressData]);

  const navigation = useNavigation();

  const handleContinue = () => {
    const trimmedName = name.trim();
    const trimmedAddress1 = address1.trim();
    const trimmedLandmark = landmark.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();
    const trimmedMobile = mobile.trim();

    const newErrors = {};
    let firstErrorMessage = '';
    let firstInvalidRef = null;

    if (!trimmedName) {
      newErrors.name = true;
      firstErrorMessage = 'Please enter your name.';
      firstInvalidRef = nameRef;
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      newErrors.name = true;
      firstErrorMessage = 'Name can only contain letters and spaces.';
      firstInvalidRef = nameRef;
    }

    if (!trimmedMobile || !/^[0-9]\d{9}$/.test(trimmedMobile)) {
      newErrors.mobile = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter valid 10-digit mobile number.';
        firstInvalidRef = mobileRef;
      }
    }

    if (!trimmedAddress1) {
      newErrors.address1 = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter Address Line 1.';
        firstInvalidRef = address1Ref;
      }
    }

    if (!trimmedLandmark || trimmedLandmark.length < 2) {
      newErrors.landmark = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter a valid landmark.';
        firstInvalidRef = landmarkRef;
      }
    }

    if (!trimmedCity) {
      newErrors.city = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter city.';
        firstInvalidRef = cityRef;
      }
    }

    if (!trimmedState) {
      newErrors.state = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter state.';
        firstInvalidRef = stateRef;
      }
    }

    if (!trimmedState) {
      newErrors.state = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Please enter state.';
        firstInvalidRef = stateRef;
      }
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedState)) {
      newErrors.state = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'State can only contain letters and spaces.';
        firstInvalidRef = stateRef;
      }
    }

    if (!trimmedPincode || !/^\d{6}$/.test(trimmedPincode)) {
      newErrors.pincode = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'Pincode must be 6 digits.';
        firstInvalidRef = pincodeRef;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (firstErrorMessage) showToast('error', firstErrorMessage);
      if (firstInvalidRef?.current) scrollToInput(firstInvalidRef);

      return;
    }

    // Submit logic below...
    const addressObject = {
      name: trimmedName,
      mobileNumber: mobile,
      addressLine1: trimmedAddress1,
      addressLine2: address2.trim(),
      landmark: trimmedLandmark,
      city: trimmedCity,
      state: trimmedState,
      pincode: trimmedPincode,
    };

    if (mode === 'edit' && addressData?.id) {
      updateAddress({ ...addressObject, id: addressData.id });
    } else {
      const newId = Date.now().toString();
      addAddress({ ...addressObject });
    }

    setMode('add');
    setAddressData(null);

    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={formStyles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 0 : 60}
        showsVerticalScrollIndicator={false}
      >
        <BackButton
          title={
            mode === 'add' ? 'Add Delivery Address' : 'Edit Delivery Address'
          }
        />

        <View style={formStyles.centerContainer}>
          <View>
            <Text style={formStyles.label}>
              {strings.name} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={nameRef}
              placeholder="Enter Your Name"
              value={name}
              maxLength={30}
              onTextChange={text => {
                setName(text);

                setErrors(prev => ({
                  ...prev,
                  name: prev.name && text.trim().length > 0 ? false : prev.name,
                }));
              }}
              autoCapitalize="words"
              isError={errors.name}
            />
          </View>
          <View>
            <Text style={formStyles.label}>
              {strings.mobile} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={mobileRef}
              placeholder="Enter Your Contact Number"
              value={mobile}
              maxLength={10}
              keyboardType="number-pad"
              inputAccessoryViewID="monilenum"
              onTextChange={text => {
                const cleaned = text.replace(/\D/g, '');
                setMobile(cleaned);

                setErrors(prev => ({
                  ...prev,
                  mobile:
                    prev.mobile && cleaned.length === 10 ? false : prev.mobile,
                }));
              }}
              isError={errors.mobile}
            />
          </View>

          {/* Address Line 1 */}
          <View>
            <Text style={formStyles.label}>
              {strings.addressLine1} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              placeholder="Enter Your Address Line 1"
              ref={address1Ref}
              value={address1}
              maxLength={32}
              autoCapitalize="sentences"
              onTextChange={text => {
                setAddress1(text);
                if (errors.address1 && text.trim().length > 0) {
                  setErrors(prev => ({ ...prev, address1: false }));
                }
              }}
              isError={errors.address1}
            />
          </View>

          {/* Address Line 2 */}
          <View>
            <Text style={formStyles.label}>{strings.addressLine2}</Text>
            <CustomInput
              placeholder="Enter Your Address Line 2"
              value={address2}
              maxLength={32}
              autoCapitalize="sentences"
              onTextChange={setAddress2}
            />
          </View>

          {/* Landmark */}
          <View>
            <Text style={formStyles.label}>
              {strings.landmark} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={landmarkRef}
              placeholder="Enter Your Landmark"
              value={landmark}
              maxLength={20}
              autoCapitalize="sentences"
              onTextChange={text => {
                setLandmark(text);
                if (errors.landmark && text.trim().length > 0) {
                  setErrors(prev => ({ ...prev, landmark: false }));
                }
              }}
              isError={errors.landmark}
            />
          </View>

          {/* StateS */}
          <View>
            <Text style={formStyles.label}>
              {strings.state} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <StateDropdown
              selectedState={state}
              onSelectState={val => {
                setState(val);
                setCity(''); // Reset city if state changes
                setErrors(prev => ({
                  ...prev,
                  state: prev.state ? !val : false,
                  city: false, // reset city error if any
                }));
              }}
              error={errors.state}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              dropdownKey="state"
            />
          </View>

          {/* City */}
          <View>
            <Text style={formStyles.label}>
              {strings.city} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CityDropdown
              selectedState={state}
              selectedCity={city}
              onSelectCity={val => {
                setCity(val);
                setErrors(prev => ({
                  ...prev,
                  city: prev.city ? !val : false,
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
          {/* <Text style={formStyles.label}>
              {strings.city} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={cityRef}
              placeholder="Enter Your City"
              value={city}
              maxLength={20}
              autoCapitalize="sentences"
              onTextChange={text => {
                setCity(text);
                if (errors.city && text.trim().length > 0) {
                  setErrors(prev => ({ ...prev, city: false }));
                }
              }}
              isError={errors.city}
            /> */}
          {/* Pincode */}
          <View>
            <Text style={formStyles.label}>
              {strings.pincode} <Text style={formStyles.mandatory}>*</Text>
            </Text>
            <CustomInput
              ref={pincodeRef}
              placeholder="Enter Your Pincode"
              value={pincode}
              maxLength={6}
              keyboardType="number-pad"
              inputAccessoryViewID="pincode"
              input
              onTextChange={text => {
                const cleaned = text.replace(/\D/g, '');
                setPincode(cleaned);
                if (errors.pincode && cleaned.length === 6) {
                  setErrors(prev => ({ ...prev, pincode: false }));
                }
              }}
              isError={errors.pincode}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      <View style={formStyles.buttonContainer}>
        <CustomButton title={strings.continue} onPress={handleContinue} />
      </View>
      {/* </TouchableWithoutFeedback> */}
    </View>
  );
};

export default AddressForm;

const formStyles = ScaledSheet.create({
  scrollContent: {
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flexGrow: 1,
    marginTop: '15@vs',
    paddingHorizontal: '20@s',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  buttonContainer: {
    paddingVertical: '10@vs',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
