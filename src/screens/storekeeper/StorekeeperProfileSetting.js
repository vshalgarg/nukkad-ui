import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { useAuth } from '../../contexts/authContext';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { z } from 'zod';
import { Keyboard } from 'react-native';
import strings from '../../constants/string';
import CustomButton from '../../components/CustomButton';
import Colors from '../../styles/colors';
import BackButton from '../../components/BackButton';
import CustomInput from '../../components/CustomInput';
import { ScaledSheet } from 'react-native-size-matters';
import Fonts from '../../styles/font';
import { Dimensions } from 'react-native';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useLogout } from '../../hooks/useLogout';
import CityDropdown from '../../components/CityDropdown';
import StateDropdown from '../../components/StateDropdown';
const { width } = Dimensions.get('screen');
const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, "Name can't be more that 30 characters"),
  storeName: z
    .string()
    .min(1, 'Store Name is required')
    .max(30, "Store name can't be more that 30 characters"),
  contactNumber: z
    .string()
    .min(1, 'Contact Number is required')
    .regex(/^\d{10}$/, 'Contact Number must be exactly 10 digits'),
  gstNum: z
    .string()
    .min(1, 'GST Number is required')
    .max(15, "GST Number can't be more that 30 characters"),
  storeQrId: z.string().optional(),
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(100, "Address can't be more that 100 characters"),
  // addressLine2: z
  //   .string()
  //   .min(1, 'Address is required')
  //   .max(100, "Address can't be more that 100 characters"),
  landmark: z
    .string()
    .min(1, 'Landmark is required')
    .max(200, "Landmark can't be more that 100 characters"),
  // city: z
  //   .string()
  //   .min(1, 'City is required')
  //   .max(30, "City can't be more that 30 characters"),
  // state: z
  //   .string()
  //   .min(1, 'State is required')
  //   .max(30, "State can't be more that 30 characters"),
  pincode: z
    .string()
    .min(6, 'Pincode must be 6 digits long')
    .max(6, 'Pincode must be 6 digits long'),
  imageUrls: z.array(z.string().nullable()).optional(),
});

const fieldGroups = [
  {
    title: 'Personal Details',
    fields: [
      { label: 'Name', key: 'name' },
      { label: 'Store Name', key: 'storeName' },
      { label: 'Contact Number', key: 'contactNumber' },
      { label: 'GST Number', key: 'gstNum' },
      { label: 'Store QR ID', key: 'storeQrId' },
    ],
  },
  {
    title: 'Address Details',
    fields: [
      { label: 'Address Line 1', key: 'addressLine1' },
      { label: 'Address Line 2', key: 'addressLine2' },
      { label: 'Landmark', key: 'landmark' },
      { label: 'State', key: 'state' },
      { label: 'City', key: 'city' },
      { label: 'Pincode', key: 'pincode' },
    ],
  },
];

const StorekeeperProfileScreen = () => {
  const { storekeeperProfile, updateStorekeeperProfile } =
    useStorekeeperProfile();
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const { confirmLogout } = useLogout();
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    storeName: '',
    contactNumber: '',
    gstNum: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [profile, setProfile] = useState({
    name: '',
    storeName: '',
    contactNumber: '',
    gstNum: '',
    storeQrId: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    imageUrls: [],
  });
  // Create refs for each input field
  const nameRef = useRef(null);
  const storeNameRef = useRef(null);
  const contactNumberRef = useRef(null);
  const gstNumRef = useRef(null);
  const addressLine1Ref = useRef(null);
  const addressLine2Ref = useRef(null);
  const landmarkRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const pincodeRef = useRef(null);
  const { safePush } = useSafeRouter();

  // Create a mapping of field keys to their refs
  const fieldRefs = {
    name: nameRef,
    storeName: storeNameRef,
    contactNumber: contactNumberRef,
    gstNum: gstNumRef,
    addressLine1: addressLine1Ref,
    addressLine2: addressLine2Ref,
    landmark: landmarkRef,
    city: cityRef,
    state: stateRef,
    pincode: pincodeRef,
  };

  const inputRefs = useRef({
    name: null,
    storeName: null,
    contactNumber: null,
    gstNum: null,
    addressLine1: null,
    addressLine2: null,
    landmark: null,
    city: null,
    state: null,
    pincode: null,
  });

  const scrollViewRef = useRef(null);

  const scrollToError = firstErrorKey => {
    const fieldRef = fieldRefs[firstErrorKey]?.current;
    if (fieldRef) {
      a = fieldRef.focus();
      // For scrolling, we'll use a simpler approach
      // fieldRef.measure((x, y, width, height, pageX, pageY) => {
      //   scrollViewRef.current?.scrollTo({ y: a - 50, animated: true });
      // });s
    }
  };
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (storekeeperProfile) {
      setProfile({ ...storekeeperProfile });
      setSelectedState(storekeeperProfile.state || '');
      setSelectedCity(storekeeperProfile.city || '');
    }
  }, [storekeeperProfile]);

  const handleStateChange = value => {
    setSelectedState(value);
    setSelectedCity(''); // reset city on state change
    setFieldErrors(prev => ({
      ...prev,
      state: '',
      city: '',
    }));
  };

  const handleCityChange = value => {
    setSelectedCity(value);
    setFieldErrors(prev => ({
      ...prev,
      city: '',
    }));
  };
  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({
      ...prev,
      [key]: '',
    }));

    if (isEditing) {
      validateSingleField(key, value);
    }
  };

  const validateSingleField = (key, value) => {
    try {
      const fieldSchema = profileSchema.pick({ [key]: true });
      fieldSchema.parse({ [key]: value });
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0].message;
        setFieldErrors(prev => ({ ...prev, [key]: errorMessage }));
      }
      return false;
    }
  };

  const handleImagePick = index => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;

      if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        setProfile(prev => {
          const updated = [...prev.imageUrls];
          updated[index] = uri; // replace image at index
          return { ...prev, imageUrls: updated };
        });
      }
    });
  };
  const handleRemoveImage = index => {
    setProfile(prev => {
      const updated = [...prev.imageUrls];
      updated.splice(index, 1, null); // Set null to maintain slot
      return { ...prev, imageUrls: updated };
    });
  };
  const handleSave = async () => {
    let isValid = true;
    let firstErrorKey = null;
    const fieldsToValidate = Object.keys(fieldErrors);

    const tempProfile = {
      ...profile,
      state: selectedState,
      city: selectedCity,
    };

    fieldsToValidate.forEach(key => {
      if (!validateSingleField(key, tempProfile[key])) {
        if (!firstErrorKey) firstErrorKey = key;
        isValid = false;
      }
    });

    if (!isValid) {
      scrollToError(firstErrorKey);
      return;
    }

    const allowedFields = [
      'name',
      'storeName',
      'contactNumber',
      'gstNum',
      'storeQrId',
      'addressLine1',
      'addressLine2',
      'landmark',
      'city',
      'state',
      'pincode',
      'imageUrls',
    ];

    const filteredProfile = allowedFields.reduce((acc, key) => {
      acc[key] = tempProfile[key];
      return acc;
    }, {});

    try {
      await updateStorekeeperProfile(filteredProfile, token);
      Toast.show({
        type: 'success',
        text1: strings.profileUpdatedSuccessfully,
      });
      setIsEditing(false);
      safePush('StorekeeperDashboard');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: strings.failedToUpdateProfile,
        text2: err?.message || 'Something went wrong',
      });
    }
  };

  const maxLengths = {
    name: 30,
    storeName: 30,
    contactNumber: 10,
    gstNum: 15,
    addressLine1: 35,
    addressLine2: 35,
    landmark: 20,
    city: 20,
    state: 20,
    pincode: 6,
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <BackButton title={strings.profileSetting} />
        {/* <View style={{ marginVertical: 20 }}>
        <TouchableOpacity
          style={[
            styles.editIcon,
            isEditing && styles.cancelButton
          ]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Icon
            name={isEditing ? "x" : "edit"}
            size={23}
            color={isEditing ? Colors.reject : Colors.secondary}
          />

        </TouchableOpacity>
      </View> */}

        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={{ paddingBottom: keyboardVisible ? 20 : 0 }}
          showsVerticalScrollIndicator={false}
        >
          {fieldGroups.map((group, index) => (
            <View key={index} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              {group.fields.map(field => (
                <React.Fragment key={field.key}>
                  {renderField(field.label, field.key)}
                </React.Fragment>
              ))}
            </View>
          ))}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{strings.storeImage}</Text>
            <View style={styles.imageContainer}>
              {[0, 1, 2, 3].map(i => {
                const image = profile.imageUrls[i];
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => isEditing && !image && handleImagePick(i)}
                    style={{ position: 'relative', marginBottom: 10 }}
                    activeOpacity={0.8}
                  >
                    {image ? (
                      <View>
                        <Image source={{ uri: image }} style={styles.image} />
                        {isEditing && (
                          <TouchableOpacity
                            style={styles.removeIcon}
                            onPress={() => handleRemoveImage(i)}
                          >
                            <Icon name="x" size={16} color={Colors.white} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <View style={[styles.image, styles.emptyImage]}>
                        <Text
                          style={{ color: Colors.secondaryText, fontSize: 20 }}
                        >
                          +
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isEditing && !keyboardVisible && (
        <View style={styles.ButtonContainer}>
          <CustomButton title={strings.saveChanges} onPress={handleSave} />
        </View>
      )}
      {!isEditing && (
        <View style={styles.saveButtonContainer}>
          <CustomButton
            title={'Edit'}
            onPress={() => setIsEditing(!isEditing)}
          />
          <CustomButton
            title={'Logout'}
            style={{
              backgroundColor: Colors.reject,
              borderColor: Colors.reject,
            }}
            onPress={confirmLogout}
          />
        </View>
      )}
    </View>
  );

  function renderField(label, key) {
    if (key === 'storeQrId') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <CustomInput
            value={profile[key]}
            editable={false}
            {...(!isEditing
              ? {}
              : {
                  style: { borderColor: Colors.disabledText },
                  color: Colors.disabledText,
                })}
          />
        </View>
      );
    }

    if (key === 'state') {
      return (
        <View style={styles.inputContainer} key={key}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <StateDropdown
              selectedState={selectedState}
              onSelectState={handleStateChange}
              error={!!fieldErrors.state}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              dropdownKey="state"
            />
          ) : (
            <CustomInput value={selectedState} editable={false} />
          )}
          {fieldErrors.state && (
            <Text style={styles.errorText}>{fieldErrors.state}</Text>
          )}
        </View>
      );
    }

    if (key === 'city') {
      return (
        <View style={styles.inputContainer} key={key}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <CityDropdown
              selectedState={selectedState}
              selectedCity={selectedCity}
              onSelectCity={handleCityChange}
              error={!!fieldErrors.city}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              dropdownKey="city"
            />
          ) : (
            <CustomInput value={selectedCity} editable={false} />
          )}
          {fieldErrors.city && (
            <Text style={styles.errorText}>{fieldErrors.city}</Text>
          )}
        </View>
      );
    }

    // Default: render normal text input
    return (
      <View style={styles.inputContainer} key={key}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <>
            <CustomInput
              ref={fieldRefs[key]}
              value={profile[key]}
              onTextChange={val => handleChange(key, val)}
              placeholder={label}
              maxLength={maxLengths[key]}
              onBlur={() => validateSingleField(key, profile[key])}
              keyboardType={
                key === 'contactNumber' || key === 'pincode'
                  ? 'number-pad'
                  : 'default'
              }
              inputAccessoryViewID={
                key === 'contactNumber'
                  ? 'DoneAccessory'
                  : key === 'pincode'
                  ? 'pincode'
                  : null
              }
            />
            {fieldErrors[key] ? (
              <Text style={styles.errorText}>{fieldErrors[key]}</Text>
            ) : null}
          </>
        ) : (
          <View>
            <CustomInput value={profile[key]} editable={false} />
          </View>
        )}
      </View>
    );
  }
};

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
    marginTop: 30,
  },
  header: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: '70@vs',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    marginRight: '20@s',
    padding: '2@s',
    borderRadius: '30@s',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: '1.5@s',
    borderColor: Colors.reject,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    gap: '10@s',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  fieldWrapper: {
    marginBottom: '24@vs',
  },
  inputContainer: {
    marginBottom: '10@vs',
  },
  label: {
    fontSize: '14@s',
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '4@vs',
  },
  profileHeader: {
    fontSize: '22@s',
    fontWeight: 'bold',
    marginBottom: '24@vs',
    textAlign: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: '16@s',
  },
  image: {
    width: '65@s',
    height: '65@s',
    borderRadius: '10@s',
    resizeMode: 'cover',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    position: 'absolute',
    top: '-8@vs',
    right: '-8@s',
    backgroundColor: Colors.reject,
    borderRadius: '12@s',
    padding: '4@s',
    zIndex: 10,
    elevation: 3,
  },
  emptyImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorInput: {
    borderColor: Colors.reject,
  },
  errorText: {
    color: Colors.reject,
    fontSize: '12@s',
  },
  sectionContainer: {
    marginBottom: '24@vs',
    backgroundColor: Colors.sectionBackground,
    borderRadius: '8@s',
    padding: '16@s',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: '16@vs',
    color: Colors.secondary,
  },
  saveButtonContainer: {
    flexDirection: 'row',
    // height: '70@vs',
    paddingVertical: '10@vs',

    paddingHorizontal: '20@s',
    // width:"90%",
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ButtonContainer: {
    flexDirection: 'row',
    // height: '70@vs',
    paddingVertical: '10@vs',
    paddingHorizontal: '20@s',
    // width:"90%",
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0.02 * width,
  },
});

export default StorekeeperProfileScreen;
