import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Pressable,
  Text,
  View,
  Keyboard,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Grocery from '../../../assets/images/grocery-logo.svg';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import styles from '../../styles/globalStyles';
import { showToast } from '../../utils/toastUtils';
import Colors from '../../styles/colors';
import textStyles from '../../styles/textStyles';
import Fonts from '../../styles/font';
import { sendOtp, verifyOtp } from '../../services/authApi';
import { useAuth } from '../../contexts/authContext';
import { setCartItems, setCartUser } from '../../store/cartSlice';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { getCartItemsAPI } from '../../services/customer/cartService';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';

const MobileOtpScreen = () => {
  const { safePush } = useSafeRouter();
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [sendOtpClicked, setSendOtpClicked] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const [confirmResult, setConfirmResult] = useState(null);
  // const [sendingOtp, setSendingOtp] = useState(false);

  const userType = useSelector(state => state.user.userType);
  const { fetchStorekeeperProfile } = useStorekeeperProfile();

  useEffect(() => {
    setSendOtpClicked(false);
    setCanResend(false);
    setTimer(0);
    clearTimeout(timerRef.current);
  }, [mobile]);

  useEffect(() => {
    if (!sendOtpClicked || canResend) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sendOtpClicked, canResend]);

  //  Send OTP: backend + Firebase
  const sendOtpRequest = async (isResend = false) => {
    Keyboard.dismiss();
    // setSendingOtp(true); // show "Sending..."
    try {
      const role = userType === 'I AM CUSTOMER' ? 'CUSTOMER' : 'STOREKEEPER';

      // 1. Notify backend
      await sendOtp(mobile, role);
      setSendOtpClicked(true);
      setOtpEnabled(true);
      setTimer(30);
      setCanResend(false);
      showToast(
        'success',
        isResend ? strings.otpResent : strings.otpSent,
        `OTP ${isResend ? 'resent' : 'sent'} to ${mobile}`,
      );
      const phoneNumber = `+91${mobile}`;

      // 2. Trigger Firebase OTP
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmResult(confirmation);
    } catch (error) {
      console.error('Send OTP Error:', error);

      if (error.message === 'No Internet Connection') {
        showToast(
          'error',
          'No Internet',
          'Please check your network connection.',
        );
      } else {
        // fallback for other errors
        showToast(
          'error',
          error.message || 'Failed to send OTP',
          'OTP could not be sent',
        );
      }
    }
  };

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      showToast('error', strings.invalidMobile, strings.validMobileNumber);
      return;
    }
    sendOtpRequest(false);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    sendOtpRequest(true);
  };

  //  Verify OTP: Firebase + backend
  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      showToast('error', strings.invalidOtp, strings.tryAgain);
      return;
    }

    try {
      let firebaseUser = auth().currentUser;

      if (!firebaseUser) {
        const userCredential = await confirmResult.confirm(otp);
        firebaseUser = userCredential.user;
      }

      const firebaseToken = await firebaseUser.getIdToken();

      const res = await verifyOtp({ mobile, firebaseToken });
      const role = res.roles[0];
      const token = res?.token;
      const userId = res?.userId;
      const returningUser = res.firstTimeLogin === 1502;
      if (returningUser) {
        await AsyncStorage.setItem('ProfileCreated', 'true');
      }

      if (!token) throw new Error('No token received');

      await AsyncStorage.removeItem('selectedAddressId');
      await login({ token, role, userId });
      dispatch(setCartUser(userId));

      console.log('*****user Role *****', role);

      if (role === 'CUSTOMER') {
        if (returningUser) {
          try {
            const cartItems = await getCartItemsAPI(token);
            const formattedItems = (cartItems || []).map(item => ({
              cartItemId: item.id,
              product: {
                id: item.itemId,
                name: item.itemName,
                image: item.imageUrls?.[0] || '',
                amount: item.quantity,
                selectedUnit: item.selectedUnit,
                quantity: item.allUnits,
              },
            }));
            dispatch(setCartItems(formattedItems));
          } catch (err) {
            console.warn('Skipping cart fetch:', err.message);
          }
          safePush('CustomerDashboard');
          showToast('success', strings.Welcome);
        } else {
          safePush('CustomerCreateProfile', { mobile, role });
        }
      } else {
        if (returningUser) {
          safePush('StorekeeperDashboard');
        } else {
          safePush('StorekeeperCreateProfile', { mobile, role });
        }
      }
    } catch (error) {
      console.error('OTP Verify Error:', error.message);
      showToast('error', strings.otpFailed, 'Please enter a correct OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={localStyles.centerContent}>
          <Grocery style={localStyles.logo} />
          <Text
            style={[
              styles.pageHeading,
              textStyles.heading,
              { marginBottom: 20 },
            ]}
          >
            {strings.login}
          </Text>

          <CustomInput
            isCountryCode={true}
            placeholder="Enter Mobile Number"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onTextChange={text => setMobile(text.replace(/[^0-9]/g, ''))}
          />

          <Text
            style={[
              localStyles.otpPrompt,
              !otpEnabled && { borderColor: Colors.disabledText, opacity: 0.2 },
            ]}
          >
            {strings.enterOtp}
          </Text>

          <CustomInput
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            editable={otpEnabled}
            onTextChange={text => setOtp(text.replace(/[^0-9]/g, ''))}
            style={
              !otpEnabled
                ? { borderColor: Colors.disabledText, opacity: 0.2 }
                : {}
            }
          />

          <View style={localStyles.resendContainer}>
            <Text
              style={[
                localStyles.haventReceivedText,
                (!canResend || !sendOtpClicked) && localStyles.textDisabled,
              ]}
            >
              {strings.havnotReceivedOtp}
            </Text>
            <Pressable
              onPress={handleResendOtp}
              disabled={!canResend || !sendOtpClicked}
            >
              <Text
                style={[
                  localStyles.resendText,
                  canResend && sendOtpClicked
                    ? localStyles.resendEnabled
                    : sendOtpClicked
                    ? localStyles.resendWaiting
                    : localStyles.resendDisabled,
                ]}
              >
                {!sendOtpClicked
                  ? strings.resendOtp
                  : canResend
                  ? strings.resendOtp
                  : strings.resendOtpAvailable(timer)}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={localStyles.loginBtn}>
          <CustomButton
            onPress={sendOtpClicked ? handleLogin : handleSendOtp}
            title={
              // sendingOtp
              //   ? 'Sending...' // while sending
              //   :
              sendOtpClicked
                ? strings.login // after OTP field editable
                : strings.sendOtp // initial state
            }
            disabled={
              // sendingOtp || // disable while sending
              sendOtpClicked ? !otpEnabled : mobile.length !== 10
            }
          />
        </View>
        <View style={localStyles.policyContainer}>
          <Text style={localStyles.policyText}>
            {strings.agreeTo}
            <Text
              onPress={() =>
                Linking.openURL('https://policies.google.com/terms?hl=en-US')
              }
              style={localStyles.underline}
            >
              {strings.termsAndConditions}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MobileOtpScreen;

const localStyles = ScaledSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
    paddingVertical: '10@vs',
  },
  logo: { marginVertical: '16@vs' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
    paddingTop: '40@vs',
    paddingBottom: '40@vs',
    backgroundColor: Colors.white,
  },
  otpPrompt: {
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBlock: '12@vs',
    marginVertical: '12@vs',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '5@vs',
    marginBottom: '8@vs',
  },
  resendText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    marginLeft: '4@ms',
  },
  resendEnabled: { color: Colors.primary },
  resendDisabled: { color: Colors.disabledText, opacity: 0.2 },
  resendWaiting: { color: Colors.disabledText, opacity: 0.6 },
  policyContainer: { marginTop: '20@vs', paddingHorizontal: '10@ms' },
  policyText: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: '22@vs',
  },
  underline: { textDecorationLine: 'underline', color: Colors.secondary },
  loginBtn: { marginBlock: '20@vs', width: '100%', alignItems: 'center' },
  haventReceivedText: { fontSize: Fonts.sizes.sm, color: Colors.secondary },
  textDisabled: { color: Colors.disabledText, opacity: 0.2 },
});
