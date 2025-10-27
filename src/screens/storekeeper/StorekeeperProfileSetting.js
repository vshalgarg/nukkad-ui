import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { useAuth } from '../../contexts/authContext';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { z } from 'zod';
import strings from '../../constants/string';
import CustomButton from '../../components/CustomButton';
import Colors from '../../styles/colors';
import BackButton from '../../components/BackButton';
import CustomInput from '../../components/CustomInput';
import { ScaledSheet } from 'react-native-size-matters';
import Fonts from '../../styles/font';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useLogout } from '../../hooks/useLogout';
import CityDropdown from '../../components/CityDropdown';
import StateDropdown from '../../components/StateDropdown';
import {
  deleteImageAsync,
  uploadImageAsync,
} from '../../services/firebase/firebaseConfig';
import { useDialog } from '../../contexts/DialogContext';

const { width } = Dimensions.get('screen');

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, "Name can't be more than 30 characters"),
  storeName: z
    .string()
    .min(1, 'Store Name is required')
    .max(30, "Store name can't be more than 30 characters"),
  contactNumber: z
    .string()
    .min(1, 'Contact Number is required')
    .regex(/^\d{10}$/, 'Contact Number must be exactly 10 digits'),
  gstNum: z.string().optional().or(z.literal('')),
  storeQrId: z.string().optional(),
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(100, "Address can't be more than 100 characters"),
  landmark: z
    .string()
    .min(1, 'Landmark is required')
    .max(200, "Landmark can't be more than 200 characters"),
  pincode: z
    .string()
    .min(6, 'Pincode must be 6 digits long')
    .max(6, 'Pincode must be 6 digits long'),
  imageUrls: z.array(z.string().nullable()).optional(),
});

const fieldGroups = [
  {
    // title: 'Personal Details',
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
  const { showDialog } = useDialog();
  const { confirmLogout } = useLogout();
  const { safePush } = useSafeRouter();
  const [scrollPosition, setScrollPosition] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
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

  const scrollViewRef = useRef(null);

  const fieldRefs = {
    name: useRef(null),
    storeName: useRef(null),
    contactNumber: useRef(null),
    gstNum: useRef(null),
    addressLine1: useRef(null),
    addressLine2: useRef(null),
    landmark: useRef(null),
    city: useRef(null),
    state: useRef(null),
    pincode: useRef(null),
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
    setSelectedCity('');
    setFieldErrors(prev => ({ ...prev, state: '', city: '' }));
  };

  const handleCityChange = value => {
    setSelectedCity(value);
    setFieldErrors(prev => ({ ...prev, city: '' }));
  };

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    if (isEditing) validateSingleField(key, value);
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

  const scrollToError = firstErrorKey => {
    const fieldRef = fieldRefs[firstErrorKey]?.current;
    if (fieldRef) {
      fieldRef.measureLayout(scrollViewRef.current, (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        fieldRef.focus?.();
      });
    }
  };

  const handleImagePick = async index => {
    const options = { mediaType: 'photo', quality: 0.7 };
    launchImageLibrary(options, async response => {
      if (response.didCancel) return;

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const fileName = asset.fileName || `store_${Date.now()}.jpg`;

        try {
          setUploadingIndex(index);

          const firebaseUrl = await uploadImageAsync(asset.uri, fileName);

          setProfile(prev => {
            const images = prev.imageUrls.filter(Boolean);
            images.push(firebaseUrl);

            while (images.length < 4) images.push(null);

            return { ...prev, imageUrls: images };
          });
        } catch (err) {
          console.error('Firebase upload failed:', err);
          Toast.show({
            type: 'error',
            text1: 'Image upload failed',
            text2: err.message || '',
          });
        } finally {
          setUploadingIndex(null);
        }
      }
    });
  };

  const handleRemoveImage = index => {
    const img = profile.imageUrls[index];
    if (!img) return;

    showDialog({
      title: 'Remove',
      message: 'Do you want to remove this image?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Remove pic cancelled');
      },
      onConfirm: () => {
        setProfile(prev => {
          const images = prev.imageUrls.filter(Boolean);
          images.splice(index, 1);
          while (images.length < 4) images.push(null);
          return { ...prev, imageUrls: images };
        });
      },
    });
  };

  const handleSave = async () => {
    let isValid = true;
    let firstErrorKey = null;
    const tempProfile = {
      ...profile,
      state: selectedState,
      city: selectedCity,
    };

    Object.keys(fieldErrors).forEach(key => {
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
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 0);
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

  const renderField = (label, key) => {
    const hasError = !!fieldErrors[key];
    if (key === 'storeQrId')
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <CustomInput
            value={profile[key]}
            editable={false}
            style={hasError ? styles.errorInput : {}}
          />
          {hasError && <Text style={styles.errorText}>{fieldErrors[key]}</Text>}
        </View>
      );

    if (key === 'state')
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <StateDropdown
              selectedState={selectedState}
              onSelectState={handleStateChange}
              error={hasError}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              dropdownKey="state"
            />
          ) : (
            <CustomInput
              value={selectedState}
              editable={false}
              style={hasError ? styles.errorInput : {}}
            />
          )}
          {hasError && (
            <Text style={styles.errorText}>{fieldErrors.state}</Text>
          )}
        </View>
      );

    if (key === 'city')
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <CityDropdown
              selectedState={selectedState}
              selectedCity={selectedCity}
              onSelectCity={handleCityChange}
              error={hasError}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              dropdownKey="city"
            />
          ) : (
            <CustomInput
              value={selectedCity}
              editable={false}
              style={hasError ? styles.errorInput : {}}
            />
          )}
          {hasError && <Text style={styles.errorText}>{fieldErrors.city}</Text>}
        </View>
      );

    return (
      <View style={styles.inputContainer}>
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
              style={hasError ? styles.errorInput : {}}
            />
            {hasError && (
              <Text style={styles.errorText}>{fieldErrors[key]}</Text>
            )}
          </>
        ) : (
          <CustomInput
            value={profile[key]}
            editable={false}
            style={hasError ? styles.errorInput : {}}
          />
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <BackButton title={strings.storeDetail} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={{ paddingBottom: keyboardVisible ? 20 : 0 }}
          showsVerticalScrollIndicator={false}
          onScroll={e => setScrollPosition(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {fieldGroups.map((group, index) => (
            <View key={index} style={styles.sectionContainer}>
              {group.title && (
                <Text style={styles.sectionTitle}>{group.title}</Text>
              )}

              {group.fields.map(field => (
                <React.Fragment key={field.key}>
                  {renderField(field.label, field.key)}
                </React.Fragment>
              ))}
            </View>
          ))}

          {(isEditing ||
            (profile.imageUrls && profile.imageUrls.some(url => url))) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{strings.storeImage}</Text>

              <View style={styles.imageContainer}>
                {(isEditing
                  ? [0, 1, 2, 3]
                  : profile.imageUrls.filter(url => url)
                ).map((_, i) => {
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
                        isEditing && (
                          <View style={[styles.image, styles.emptyImage]}>
                            {uploadingIndex === i ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.secondary}
                              />
                            ) : (
                              <Text
                                style={{
                                  color: Colors.secondaryText,
                                  fontSize: 20,
                                }}
                              >
                                +
                              </Text>
                            )}
                          </View>
                        )
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {isEditing && !keyboardVisible && (
        <View style={styles.ButtonContainer}>
          <CustomButton
            title={strings.saveChanges}
            onPress={handleSave}
            disabled={uploadingIndex !== null}
          />
        </View>
      )}

      {!isEditing && (
        <View style={styles.saveButtonContainer}>
          <CustomButton title={'Edit'} onPress={() => setIsEditing(true)} />
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
};

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
    marginTop: 30,
  },
  inputContainer: { marginBottom: '10@vs' },
  label: {
    fontSize: '14@s',
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '4@vs',
  },
  errorInput: { borderColor: Colors.reject },
  errorText: { color: Colors.reject, fontSize: '12@s' },
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
    paddingVertical: '10@vs',
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ButtonContainer: {
    flexDirection: 'row',
    paddingVertical: '10@vs',
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0.02 * width,
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
});

export default StorekeeperProfileScreen;
