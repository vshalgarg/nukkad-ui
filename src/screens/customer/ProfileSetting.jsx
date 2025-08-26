import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CameraIcon from '../../../assets/images/Camera.svg';
import ProfileImage from '../../../assets/images/ProfileImage.svg';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import { useProfile } from '../../contexts/profileContext';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import styles from '../../styles/globalStyles';
import { showToast } from '../../utils/toastUtils';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import { getCustomerProfile } from '../../services/customer/profileService';
import { useAuth } from '../../contexts/authContext';
import strings from '../../constants/string';
import DeleteAccount from '../../components/DeleteAccount';
import { useAddress } from '../../contexts/addressContext';
import { useStore } from '../../contexts/storeContext';
import { useDispatch } from 'react-redux';
import { ScaledSheet } from 'react-native-size-matters';
import { useDialog } from '../../contexts/DialogContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from '../../store/store.js';
import { useLogout } from '../../hooks/useLogout.jsx'

const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}-${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}-${d.getFullYear()}`;
};

const ProfileSetting = () => {
  const scrollRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const firstNameRef = useRef(null);
  const { resetProfile } = useProfile();
  const { resetAddress } = useAddress();
  const { resetStore } = useStore();
  const dispatch = useDispatch();
  const { showDialog } = useDialog()
  const { confirmLogout } = useLogout()
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const { safePush } = useSafeRouter();
  const { token, role } = useAuth();
  const { profile: profileData, updateProfile, createProfile } = useProfile();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    image: '',
    role: role || '',
    dob: '',
  });
  const [DOB, setDOB] = useState('');
  const [dobDate, setDobDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const cachedProfile = profileData || {};
        if (cachedProfile?.firstName) {
          setProfile(cachedProfile);

          if (cachedProfile.dob) {
            setDOB(formatDate(cachedProfile.dob));
            setDobDate(new Date(cachedProfile.dob));
          }

          // Allow UI to render with cached data instantly
          setLoading(false);
        }

        // Fetch fresh data in the background
        const userProfile = await getCustomerProfile(token);
        if (!isMounted) return;

        const formattedProfile = {
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || '',
          image: userProfile.image || null,
          role: role || '',
          dob: userProfile.dob || '',
          mobileNumber: userProfile.mobileNumber,
        };

        setProfile(formattedProfile);
        createProfile(formattedProfile);

        if (userProfile.dob) {
          setDOB(formatDate(userProfile.dob));
          setDobDate(new Date(userProfile.dob));
        }
      } catch (err) {
        showToast('error', err.message || strings.failedToLoadProfile);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);
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

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
      });

      const asset = result.assets?.[0];
      if (asset?.uri) {
        setProfile(prev => ({
          ...prev,
          image: asset.uri,
        }));
      }
    } catch (error) {
      console.log('Image Picker Error:', error);
    }
  };

  const handleImageLoad = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (_, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDobDate(selectedDate);
      setDOB(formatDate(selectedDate));
    }
  };

  const saveProfile = async () => {
    Keyboard.dismiss();
    if (!profile) return;

    // Validate required fields
    if (!profile.firstName?.trim()) {
      showToast('error', 'First name cannot be empty');
      return;
    }
    if (!profile.lastName?.trim()) {
      showToast('error', 'Last name cannot be empty');
      return;
    }
    if (!profile.email?.trim()) {
      showToast('error', 'Email cannot be empty');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email.trim())) {
      showToast('error', 'Invalid email format');
      return;
    }

    setIsSaving(true);

    const formattedDOB = dobDate.toISOString().split('T')[0];
    const updatedProfile = {
      ...profile,
      dob: formattedDOB,
      firstName: profile.firstName || profileData?.firstName || '',
      lastName: profile.lastName || profileData?.lastName || '',
      email: profile.email || profileData?.email || '',
    };

    try {
      await updateProfile(updatedProfile, token);
      setIsEditing(false);
      handlePress();
    } catch (err) {
      showToast('error', err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePress = () => {
    safePush('CustomerDashboard');
  };

  const handleDeleteAccount = () => {
    Keyboard.dismiss();
    setShowDeleteModal(true);
  };
  const handleLogout = () => {
    showDialog({
      title: 'Logout',
      message: 'Are you sure you want to Logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Logout cancelled');
      },
      onConfirm: async () => {
        try {
          setLoggingOut(true); // ✅ Prevents back confirmation
          await persistor.purge();
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userRole');
          await AsyncStorage.removeItem('storekeeperProfile');
          await AsyncStorage.clear();
          dispatch(clearCart());
          dispatch(resetUser());
          resetProfile();
          resetAddress();
          resetStore();
          safeReplace('Home');
        } catch (error) {
          console.error('Logout failed:', error);
          showToast(
            'error',
            'Failed Logout',
            err?.message || 'Please try again',
          );
        } finally {
          setTimeout(() => setLoggingOut(false), 100);
        }
      },

    })

  }
  const cancelEdit = () => {
    setIsEditing(false);
    setProfile({
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      email: profileData?.email || '',
      image: profileData?.image || '',
      role: profileData?.role || role || '',
      dob: profileData?.dob || '',
    });

    if (profileData?.dob) {
      setDOB(formatDate(profileData.dob));
      setDobDate(new Date(profileData.dob));
    }
  };
  console.log('profileData');

  return (
    <View style={{ flex: 1, backgroundColor: 'white', }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.pageContainer}
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <BackButton title={strings.profileSetting} onPress={handlePress} />

            <View style={innerStyle.container}>
              <View style={innerStyle.profileImageSection}>
                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} />
                ) : (
                  <TouchableOpacity onPress={isEditing ? pickImage : null}>
                    {profile.image ? (
                      <Animated.Image
                        source={{ uri: profile.image }}
                        style={[innerStyle.image, { opacity: fadeAnim }]}
                        onLoad={handleImageLoad}
                      />
                    ) :
                      //(
                      //   <View style={[innerStyle.image]}>
                      //     <ProfileImage height={150} width={150} />
                      //   </View>
                      // )
                      <EvilIcons name="user" color="#000" size={140} />
                    }
                  </TouchableOpacity>
                )}

                {isEditing && (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={innerStyle.cameraIconContainer}
                  >
                    <CameraIcon style={innerStyle.cameraIcon} />
                  </TouchableOpacity>
                )}
              </View>

            </View>

            <View style={innerStyle.profileDetails}>
              <View style={innerStyle.row}>
                <Text style={innerStyle.halfLabel}>{strings.firstName}</Text>
                <Text style={innerStyle.halfLabel}>{strings.lastName}</Text>
              </View>
              <View style={innerStyle.row}>
                {isEditing ? (
                  <>
                    <TextInput
                      ref={firstNameRef}
                      style={innerStyle.halfInput}
                      value={profile.firstName}
                      onChangeText={val => {
                        // Only keep letters
                        let cleanText = val.replace(/[^A-Za-z]/g, '');

                        // Optional: capitalize first letter
                        // cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

                        if (cleanText !== profile.firstName) {
                          handleChange('firstName', cleanText);
                        }
                      }}
                      maxLength={15}
                    />
                    <TextInput
                      style={innerStyle.halfInput}
                      value={profile.lastName}
                      onChangeText={val => {
                        // Allow only letters and spaces
                        const cleanText = val.replace(/[^A-Za-z ]/g, '');

                        if (cleanText !== profile.lastName) {
                          handleChange('lastName', cleanText);
                        }
                      }}
                      maxLength={15}
                    />
                  </>
                ) : (
                  <>
                    <Text style={innerStyle.halfInput}>{profile.firstName}</Text>
                    <Text style={innerStyle.halfInput}>{profile.lastName}</Text>
                  </>
                )}
              </View>

              <View style={innerStyle.email}>
                <Text style={innerStyle.fullLabel}>{strings.email}</Text>
                {isEditing ? (
                  <TextInput
                    style={innerStyle.fullInput}
                    value={profile.email}
                    keyboardType="email-address"
                    maxLength={30}
                    autoCapitalize="none"
                    onChangeText={val => handleChange('email', val)}
                  />
                ) : (
                  <Text style={innerStyle.fullInput}>{profile.email}</Text>
                )}
              </View>

              <View>
                <Text style={innerStyle.fullLabel}>{strings.dob}</Text>
                {isEditing ? (
                  <>
                    <Pressable onPress={() => setShowPicker(true)}>
                      <TextInput
                        style={innerStyle.dob}
                        value={DOB}
                        editable={false}
                      />
                    </Pressable>
                    {showPicker && (
                      <DateTimePicker
                        value={dobDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={
                          new Date(
                            new Date().setFullYear(new Date().getFullYear() - 10),
                          )
                        }
                        minimumDate={
                          new Date(
                            new Date().setFullYear(new Date().getFullYear() - 75),
                          )
                        }
                      />
                    )}
                  </>
                ) : (
                  <Text style={innerStyle.dob}>{DOB}</Text>
                )}
              </View>
            </View>

          </ScrollView>
          {(isEditing && !keyboardVisible) ? (
            <View style={innerStyle.buttonContainer}>
              <CustomButton
                title="Save Changes"
                onPress={saveProfile}
                loading={isSaving}
              />
              {profile.role === 'CUSTOMER' && (
                <CustomButton
                  title="Delete Account"
                  onPress={handleDeleteAccount}
                  style={{
                    backgroundColor: Colors.reject,
                    borderColor: Colors.reject,
                  }}
                />
              )}
            </View>
          ) : (!keyboardVisible &&<View style={innerStyle.buttonContainer}>
            <CustomButton
              title="Edit"
              onPress={() => {
                setIsEditing(true);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                setTimeout(() => {
                  firstNameRef.current?.focus();
                }, 100);
              }}
            />
            <CustomButton
              title="Logout"
              style={{
                backgroundColor: Colors.reject,
                borderColor: Colors.reject,
              }}
              onPress={confirmLogout}
            // loading={isSaving}
            />
          </View>)}
        </View>

      </TouchableWithoutFeedback>
      <DeleteAccount
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
        }}
        phoneNumber={profileData?.mobileNumber}
      />
    </View>


  );
};

export default ProfileSetting;

const innerStyle = ScaledSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30@vs',
    marginBottom: '40@vs',
  },
  profileImageSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120@s',
    height: '120@s',
  },
  image: {
    width: '120@s',
    height: '120@s',
    borderRadius: '65@s',
    resizeMode: 'contain',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraIcon: {
    height: '42@s',
    width: '42@s',
  },
  editButtonWrapper: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  editText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
  cancelText: {
    color: Colors.reject,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },

  profileDetails: {
    width: '100%',
    marginTop: '10@vs',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '13@s',
  },
  halfInput: {
    flex: 1,
    marginBottom: '10@vs',
    borderBottomWidth: 1,
    borderRadius: '12@s',
    padding: '10@s',
    fontSize: Fonts.sizes.base,
    // marginHorizontal: '5@s',
  },
  fullInput: {
    marginBottom: '16@vs',
    marginHorizontal: '12@s',
    borderBottomWidth: 1,
    borderRadius: '12@s',
    padding: '12@s',
    fontSize: Fonts.sizes.base,
  },
  halfLabel: {
    flex: 1,
    marginHorizontal: '10@s',
    marginTop: '10@vs',
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  fullLabel: {
    marginHorizontal: '25@s',
    marginTop: '10@vs',
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  dob: {
    marginBottom: '16@vs',
    marginHorizontal: '12@s',
    borderBottomWidth: 1,
    borderRadius: '12@s',
    padding: '12@s',
    fontSize: Fonts.sizes.base,
  },
  buttonContainer: {
    justifyContent: 'space-around',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@vs',
    // marginVertical: '30@vs',
    // paddingHorizontal: '20@s',
  },
});
