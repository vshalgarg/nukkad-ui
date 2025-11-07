import { useEffect, useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Keyboard,
  InteractionManager,
  findNodeHandle,
  UIManager,
  TouchableWithoutFeedback,
} from 'react-native';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import StateDropdown from '../../components/StateDropdown';
import CityDropdown from '../../components/CityDropdown';
import useKeyboardStatus from '../../hooks/useKeyboardStatus';
import { useAddress } from '../../contexts/addressContext';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import { showToast } from '../../utils/toastUtils';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';

const AddressForm = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const isKeyboardVisible = useKeyboardStatus();

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

  const navigation = useNavigation();

  const nameRef = useRef(null);
  const mobileRef = useRef(null);
  const address1Ref = useRef(null);
  const landmarkRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const pincodeRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollToInput = ref => {
    if (!ref?.current || !scrollRef?.current) return;

    const inputHandle = findNodeHandle(ref.current);
    const scrollHandle = findNodeHandle(scrollRef.current);

    if (inputHandle && scrollHandle) {
      InteractionManager.runAfterInteractions(() => {
        UIManager.measureLayout(
          inputHandle,
          scrollHandle,
          error => console.log('measureLayout error:', error),
          (x, y) => {
            scrollRef.current.scrollTo({ y: y - 20, animated: true });
            setTimeout(() => ref.current.focus?.(), 300);
          },
        );
      });
    }
  };

  useEffect(() => {
    if (mode === 'edit' && addressData) {
      setName(addressData.name || '');
      setMobile(addressData.mobileNumber || '');
      setAddress1(addressData.addressLine1 || '');
      setAddress2(addressData.addressLine2 || '');
      setLandmark(addressData.landmark || '');
      setCity(addressData.city || '');
      setState(addressData.state || '');
      setPincode(addressData.pincode || '');
    } else {
      setName('');
      setMobile('');
      setAddress1('');
      setAddress2('');
      setLandmark('');
      setCity('');
      setState('');
      setPincode('');
    }
  }, [mode, addressData]);

  const handleContinue = () => {
    const trimmedName = name.trim();
    const trimmedMobile = mobile.trim();
    const trimmedAddress1 = address1.trim();
    const trimmedLandmark = landmark.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();

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

    if (!trimmedMobile || !/^[0-9]{10}$/.test(trimmedMobile)) {
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

    const addressObject = {
      name: trimmedName,
      mobileNumber: trimmedMobile,
      addressLine1: trimmedAddress1,
      addressLine2: address2.trim(),
      landmark: trimmedLandmark,
      city: trimmedCity,
      state: trimmedState,
      pincode: trimmedPincode,
    };

    if (mode === 'edit' && addressData?.id)
      updateAddress({ ...addressObject, id: addressData.id });
    else addAddress({ ...addressObject });

    setMode('add');
    setAddressData(null);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={() => setOpenDropdown(null)}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: isKeyboardVisible ? 100 : 20,
          }}
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
                onFocus={() => setOpenDropdown(null)}
                onTextChange={text => {
                  setName(text);

                  setErrors(prev => ({
                    ...prev,
                    name:
                      prev.name && text.trim().length > 0 ? false : prev.name,
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
                onFocus={() => setOpenDropdown(null)}
                keyboardType="number-pad"
                inputAccessoryViewID="monilenum"
                onTextChange={text => {
                  const cleaned = text.replace(/\D/g, '');
                  setMobile(cleaned);

                  setErrors(prev => ({
                    ...prev,
                    mobile:
                      prev.mobile && cleaned.length === 10
                        ? false
                        : prev.mobile,
                  }));
                }}
                isError={errors.mobile}
              />
            </View>

            <View>
              <Text style={formStyles.label}>
                {strings.addressLine1}{' '}
                <Text style={formStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                placeholder="Enter Your Address Line 1"
                ref={address1Ref}
                value={address1}
                maxLength={32}
                onFocus={() => setOpenDropdown(null)}
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

            <View>
              <Text style={formStyles.label}>{strings.addressLine2}</Text>
              <CustomInput
                placeholder="Enter Your Address Line 2"
                value={address2}
                maxLength={32}
                onFocus={() => setOpenDropdown(null)}
                autoCapitalize="sentences"
                onTextChange={setAddress2}
              />
            </View>

            <View>
              <Text style={formStyles.label}>
                {strings.landmark} <Text style={formStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={landmarkRef}
                placeholder="Enter Your Landmark"
                value={landmark}
                maxLength={20}
                onFocus={() => setOpenDropdown(null)}
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

            <View>
              <Text style={formStyles.label}>
                {strings.state} <Text style={formStyles.mandatory}>*</Text>
              </Text>
              <StateDropdown
                selectedState={state}
                onSelectState={val => {
                  setState(val);
                  setCity('');
                  setErrors(prev => ({
                    ...prev,
                    state: prev.state ? !val : false,
                    city: false,
                  }));
                }}
                error={errors.state}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                dropdownKey="state"
              />
            </View>

            <View>
              <Text style={formStyles.label}>
                {strings.city} <Text style={formStyles.mandatory}>*</Text>
              </Text>
              <CityDropdown
                key={state}
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
            </View>

            <View>
              <Text style={formStyles.label}>
                {strings.pincode} <Text style={formStyles.mandatory}>*</Text>
              </Text>
              <CustomInput
                ref={pincodeRef}
                placeholder="Enter Your Pincode"
                value={pincode}
                maxLength={6}
                onFocus={() => setOpenDropdown(null)}
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
        </ScrollView>
      </TouchableWithoutFeedback>
      {!isKeyboardVisible && (
        <View style={formStyles.buttonContainer}>
          <CustomButton title={strings.continue} onPress={handleContinue} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default AddressForm;

const formStyles = ScaledSheet.create({
  centerContainer: {
    marginTop: '15@vs',
    paddingHorizontal: '20@s',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginTop: '5@vs',
    marginBottom: '5@vs',
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
  },
  mandatory: { color: Colors.reject },
  buttonContainer: {
    paddingVertical: '10@vs',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
