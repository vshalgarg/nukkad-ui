import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
    .max(30, "GST Number can't be more that 30 characters"),
  storeQrId: z.string().optional(),
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(100, "Address can't be more that 100 characters"),
  addressLine2: z
    .string()
    .min(1, 'Address is required')
    .max(100, "Address can't be more that 100 characters"),
  landmark: z
    .string()
    .min(1, 'Landmark is required')
    .max(200, "Landmark can't be more that 100 characters"),
  city: z
    .string()
    .min(1, 'City is required')
    .max(30, "City can't be more that 30 characters"),
  state: z
    .string()
    .min(1, 'State is required')
    .max(30, "State can't be more that 30 characters"),
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
      { label: 'City', key: 'city' },
      { label: 'State', key: 'state' },
      { label: 'Pincode', key: 'pincode' },
    ],
  },
];

const StorekeeperProfileScreen = () => {
  const { storekeeperProfile, updateStorekeeperProfile } =
    useStorekeeperProfile();
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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
      fieldRef.focus();
      // For scrolling, we'll use a simpler approach
      fieldRef.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({ y: pageY - 100, animated: true });
      });
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
    }
  }, [storekeeperProfile]);

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    if (isEditing) {
      validateSingleField(key, value);
    }
  };

  const validateSingleField = (key, value) => {
    try {
      // Create a subset of your schema for just this field
      const fieldSchema = profileSchema.pick({ [key]: true });
      fieldSchema.parse({ [key]: value });
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0].message;
        setFieldErrors(prev => ({ ...prev, [key]: errorMessage }));
        return false;
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
    // Validate all fields first
    let isValid = true;
    let firstErrorKey = null;
    const fieldsToValidate = Object.keys(fieldErrors);

    fieldsToValidate.forEach(key => {
      if (!validateSingleField(key, profile[key])) {
        if (!firstErrorKey) {
          firstErrorKey = key;
        }
        isValid = false;
      }
    });

    if (!isValid) {
      scrollToError(firstErrorKey);
      return;
    }

    // Rest of your save logic remains the same
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
      acc[key] = profile[key];
      return acc;
    }, {});

    try {
      await updateStorekeeperProfile(filteredProfile, token);
      Toast.show({
        type: 'success',
        text1: strings.profileUpdatedSuccessfully,
      });
      setIsEditing(false);
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
    gstNum: 30,
    addressLine1: 35,
    addressLine2: 35,
    landmark: 20,
    city: 20,
    state: 20,
    pincode: 6,
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: keyboardVisible ? 20 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        <BackButton title={strings.profileSetting} />
        <View style={{ marginVertical: 25 }}>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Icon name="edit" size={20} />
          </TouchableOpacity>
        </View>

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
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
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
                      <Text style={{ color: Colors.secondaryText, fontSize: 20 }}>+</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {isEditing && !keyboardVisible && (
        <View style={styles.saveButtonContainer}>
          <CustomButton title={strings.saveChanges} onPress={handleSave} />
        </View>
      )}
    </View>
  );

  function renderField(label, key) {
    if (key === 'storeQrId') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <CustomInput value={profile[key]} editable={false} />
        </View>
      );
    }

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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 70,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 10,
    borderRadius: 30,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  fieldWrapper: {
    marginBottom: 24, // Increased spacing
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  profileHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },

  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 10,
    resizeMode: 'cover',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.reject,
    borderRadius: 12,
    padding: 4,
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
    fontSize: 12,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: Colors.sectionBackground,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.secondary,
  },
  saveButtonContainer: {
    height: 70,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StorekeeperProfileScreen;
