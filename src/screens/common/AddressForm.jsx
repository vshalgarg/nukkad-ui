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

const AddressForm = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
console.log("addressData",addressData);
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

  useEffect(() => {
    if (mode === 'edit' && addressData) {
      console.log('addressData', addressData);
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
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedCity)) {
      newErrors.city = true;
      if (!firstErrorMessage) {
        firstErrorMessage = 'City can only contain letters and spaces.';
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
      if (firstInvalidRef?.current) firstInvalidRef.current.focus();
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
          addAddress({ ...addressObject, id: newId });
        }

        setMode('add');
        setAddressData(null);

        navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgClr }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVisible ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={formStyles.scrollContent}
            keyboardDismissMode="interactive"
          >
            <BackButton
              title={
                mode === 'add'
                  ? 'Add Delivery Address'
                  : 'Edit Delivery Address'
              }
            />

            <View style={formStyles.centerContainer}>
              {/* Name */}
              <View>
                <Text style={formStyles.label}>
                  Name <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={nameRef}
                  placeholder="Enter Your Name"
                  value={name}
                  maxLength={25}
                  autoCapitalize="words"
                  onTextChange={setName}
                  isError={errors.name}
                />
              </View>
              <View>
                <Text style={formStyles.label}>
                  Contact Number <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={mobileRef}
                  placeholder="Enter Your Contact Number"
                  value={mobile}
                  maxLength={10}
                  keyboardType="phone-pad"
                  onTextChange={setMobile}
                  isError={errors.mobile}
                />
              </View>

              {/* Address Line 1 */}
              <View>
                <Text style={formStyles.label}>
                  Address Line 1 <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  placeholder="Enter Your Address Line 1"
                  ref={address1Ref}
                  value={address1}
                  maxLength={50}
                  autoCapitalize="sentences"
                  onTextChange={setAddress1}
                  isError={errors.address1}
                />
              </View>

              {/* Address Line 2 */}
              <View>
                <Text style={formStyles.label}>Address Line 2</Text>
                <CustomInput
                  placeholder="Enter Your Address Line 2"
                  value={address2}
                  maxLength={50}
                  autoCapitalize="sentences"
                  onTextChange={setAddress2}
                />
              </View>

              {/* Landmark */}
              <View>
                <Text style={formStyles.label}>
                  Landmark <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={landmarkRef}
                  placeholder="Enter Your Landmark"
                  value={landmark}
                  maxLength={25}
                  autoCapitalize="sentences"
                  onTextChange={setLandmark}
                  isError={errors.landmark}
                />
              </View>

              {/* City */}
              <View>
                <Text style={formStyles.label}>
                  City <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={cityRef}
                  placeholder="Enter Your City"
                  value={city}
                  maxLength={25}
                  autoCapitalize="sentences"
                  onTextChange={setCity}
                  isError={errors.city}
                />
              </View>

              {/* State */}
              <View>
                <Text style={formStyles.label}>
                  State <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={stateRef}
                  placeholder="Enter Your State"
                  value={state}
                  maxLength={25}
                  autoCapitalize="sentences"
                  onTextChange={setState}
                  isError={errors.state}
                />
              </View>

              {/* Pincode */}
              <View>
                <Text style={formStyles.label}>
                  Pincode <Text style={formStyles.mandatory}>*</Text>
                </Text>
                <CustomInput
                  ref={pincodeRef}
                  placeholder="Enter Your Pincode"
                  value={pincode}
                  maxLength={6}
                  keyboardType="number-pad"
                  onTextChange={setPincode}
                  isError={errors.pincode}
                />
              </View>

              <View style={formStyles.buttonContainer}>
                <CustomButton title="Continue" onPress={handleContinue} />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddressForm;

const formStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    backgroundColor: Colors.bgClr,
  },
  centerContainer: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 5,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
  },
  mandatory: {
    color: Colors.reject,
  },
  buttonContainer: {
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
});
