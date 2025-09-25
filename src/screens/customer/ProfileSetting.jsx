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
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import { useProfile } from '../../contexts/profileContext';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import strings from '../../constants/string';
import DeleteAccount from '../../components/DeleteAccount';
import { useDispatch } from 'react-redux';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import { useLogout } from '../../hooks/useLogout.jsx';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { uploadImageAsync } from '../../services/firebase/firebaseConfig.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CameraIcon from '../../../assets/images/Camera.svg';
import { useAuth } from '../../contexts/authContext.js';

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
  const dispatch = useDispatch();
  const { confirmLogout } = useLogout();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const { safePush } = useSafeRouter();
  const { role } = useAuth();
  const { profile: profileData, updateProfile, createProfile } = useProfile();

  const [profile, setProfile] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    email: profileData?.email || '',
    image: profileData?.image || '',
    role: profileData?.role || role || '',
    dob: profileData?.dob || '',
    mobileNumber: profileData?.mobile || '',
  });
  console.log('mobileNumber', profileData?.mobile);
  const [DOB, setDOB] = useState(
    profileData?.dob ? formatDate(profileData.dob) : '',
  );
  const [dobDate, setDobDate] = useState(
    profileData?.dob ? new Date(profileData.dob) : new Date(),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        // show local preview immediately
        setProfile(prev => ({ ...prev, image: asset.uri }));

        // start loader
        setLoading(true);

        const fileName = `profile_${Date.now()}.jpg`;
        const downloadURL = await uploadImageAsync(asset.uri, fileName);

        // replace local uri with firebase url
        setProfile(prev => ({ ...prev, image: downloadURL }));
      }
    } catch (error) {
      console.log('Image Picker / Firebase Error:', error);
    } finally {
      // stop loader
      setLoading(false);
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
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        setDobDate(selectedDate);
        setDOB(formatDate(selectedDate));
      }
    } else {
      if (selectedDate) {
        setDobDate(selectedDate);
        setDOB(formatDate(selectedDate));
      }
    }
  };

  const saveProfile = async () => {
    Keyboard.dismiss();

    if (!profile.firstName?.trim()) {
      return alert('First name cannot be empty');
    }
    if (!profile.lastName?.trim()) {
      return alert('Last name cannot be empty');
    }
    if (!profile.email?.trim()) {
      return alert('Email cannot be empty');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email.trim())) {
      return alert('Invalid email format');
    }

    setIsSaving(true);

    const formattedDOB = dobDate.toISOString().split('T')[0];
    const updatedProfile = {
      ...profile,
      dob: formattedDOB,
    };

    try {
      await updateProfile(updatedProfile);
      if (updatedProfile.image) {
        await AsyncStorage.setItem('profileImage', updatedProfile.image);
      }
      setIsEditing(false);
      safePush('CustomerDashboard');
    } catch (err) {
      console.log(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Keyboard.dismiss();
    setShowDeleteModal(true);
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.white }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <BackButton title={strings.profileSetting} />

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
                  ) : (
                    <View style={[innerStyle.image]}>
                      <Ionicons
                        name="person-circle-outline"
                        color="#000"
                        size={innerStyle.image.width}
                      />
                    </View>
                  )}
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
                    onChangeText={val =>
                      handleChange('firstName', val.replace(/[^A-Za-z]/g, ''))
                    }
                    maxLength={15}
                  />
                  <TextInput
                    style={innerStyle.halfInput}
                    value={profile.lastName}
                    onChangeText={val =>
                      handleChange('lastName', val.replace(/[^A-Za-z ]/g, ''))
                    }
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

            <View style={innerStyle.email}>
              <Text style={innerStyle.fullLabel}>{strings.mobile}</Text>
              <Text
                style={[
                  innerStyle.fullInput,
                  isEditing && { color: Colors.disabledText },
                ]}
              >
                {profile.mobileNumber}
              </Text>
            </View>

            <View>
              <Text style={innerStyle.fullLabel}>{strings.dob}</Text>
              {isEditing ? (
                <Pressable
                  onPress={() => {
                    setShowPicker(true);
                    Keyboard.dismiss();
                  }}
                >
                  <TextInput
                    style={innerStyle.dob}
                    value={DOB}
                    editable={false}
                    pointerEvents="none"
                  />
                </Pressable>
              ) : (
                <Text style={innerStyle.dob}>{DOB}</Text>
              )}
            </View>
          </View>

          {isEditing && !keyboardVisible ? (
            <View style={innerStyle.buttonContainer}>
              <CustomButton
                title="Save Changes"
                onPress={saveProfile}
                loading={isSaving}
                disabled={loading || isSaving} // disable while uploading or saving
                style={{
                  backgroundColor:
                    loading || isSaving ? Colors.disabled : Colors.primary,
                  borderColor:
                    loading || isSaving ? Colors.disabled : Colors.primary,
                }}
              />
              {console.log('profileRole', profile)}
              {role === 'CUSTOMER' && (
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
          ) : (
            !keyboardVisible && (
              <View style={innerStyle.buttonContainer}>
                <CustomButton
                  title="Edit"
                  onPress={() => {
                    setIsEditing(true);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                    setTimeout(() => firstNameRef.current?.focus(), 100);
                  }}
                />
                <CustomButton
                  title="Logout"
                  style={{
                    backgroundColor: Colors.reject,
                    borderColor: Colors.reject,
                  }}
                  onPress={confirmLogout}
                />
              </View>
            )
          )}

          <DeleteAccount
            visible={showDeleteModal}
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={() => setShowDeleteModal(false)}
            phoneNumber={profileData?.mobileNumber}
          />

          {isEditing && Platform.OS === 'ios' && (
            <Modal
              visible={showPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#00000099',
                    justifyContent: 'flex-end',
                  }}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View
                      style={{
                        backgroundColor: '#fff',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        paddingBottom: 20,
                        alignItems: 'center',
                      }}
                    >
                      <DateTimePicker
                        value={dobDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={
                          new Date(
                            new Date().setFullYear(
                              new Date().getFullYear() - 10,
                            ),
                          )
                        }
                        minimumDate={
                          new Date(
                            new Date().setFullYear(
                              new Date().getFullYear() - 75,
                            ),
                          )
                        }
                        style={{
                          width: '100%',
                          alignSelf: 'center',
                          backgroundColor: 'white',
                        }}
                      />
                      <View style={{ width: '90%' }}>
                        <CustomButton
                          title="Done"
                          onPress={() => setShowPicker(false)}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {isEditing && showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={
                new Date(new Date().setFullYear(new Date().getFullYear() - 10))
              }
              minimumDate={
                new Date(new Date().setFullYear(new Date().getFullYear() - 75))
              }
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
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
    borderColor:"black",
    // borderWidth:"3@s",
    resizeMode: 'cover',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0 },
  cameraIcon: { height: '42@s', width: '42@s' },
  profileDetails: { width: '100%', marginTop: '10@vs' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '13@s',
    width: '100%',
  },
  halfInput: {
    flex: 1,
    marginBottom: '10@vs',
    borderBottomWidth: 1,
    borderRadius: '12@s',
    padding: '10@s',
    fontSize: Fonts.sizes.base,
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
    position: 'absolute',
    width: '100%',
    bottom: 10,
    paddingHorizontal: '20@s',
  },
});
