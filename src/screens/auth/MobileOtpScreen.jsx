import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import useBackHandlerControl from '../../hooks/useBackHandlerControl';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext';
import { getCartItemsAPI } from '../../services/customer/cartService';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';

const MobileOtpScreen = () => {
  useBackHandlerControl({ blockBack: true });
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
  const userType = useSelector(state => state.user.userType);
  const { fetchStorekeeperProfile } = useStorekeeperProfile();
  useEffect(() => {
    setSendOtpClicked(false);
    setCanResend(false);
    setTimer(0);
    clearTimeout(timerRef.current);
  }, [mobile]);

  useEffect(() => {
    if (sendOtpClicked && !canResend && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && sendOtpClicked) {
      setCanResend(true);
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, sendOtpClicked]);

  const sendOtpRequest = async (isResend = false) => {
    try {
      const role = userType === 'I AM CUSTOMER' ? 'CUSTOMER' : 'STOREKEEPER';
      const res = await sendOtp(mobile, isResend ? null : role);
      showToast(
        'success',
        isResend ? strings.otpResent : strings.otpSent,
        res.message ||
          `OTP has been ${isResend ? 'resent' : 'sent'} successfully`,
      );
      setSendOtpClicked(true);
      setTimer(30);
      setOtpEnabled(true);
      setCanResend(false);
    } catch (error) {
      console.error(`${isResend ? 'Resend' : 'Send'} OTP Error:`, error);
      showToast(
        'error',
        error.message || 'Something went wrong',
        `Failed to ${isResend ? 'resend' : 'send'} OTP`,
      );
    }
  };

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      showToast(
        'error',
        `${strings.invalidMobile}`,
        `${strings.validMobileNumber}`,
      );
      return;
    }
    sendOtpRequest(false);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    sendOtpRequest(true);
  };

  const handleLogin = async () => {
    if (mobile.length !== 10) {
      showToast('error', `${strings.invalidMobile}`, `${strings.tryAgain}`);
      return;
    }
    if (!otp || otp.length !== 4) {
      showToast('error', `${strings.invalidOtp}`, `${strings.tryAgain}`);
      return;
    }

    try {
      const res = await verifyOtp(mobile, otp);
      const token = res?.token;
      const role = res?.roles?.[0];
      const userId = res?.userId;
      console.log(res.firstTimeLogin);
      const returningUser = res.firstTimeLogin === 1502;
      console.log(returningUser);
      console.log(role, token);

      if (!token) throw new Error('No token received');
      await AsyncStorage.removeItem('selectedAddressId');
      await login({ token, role, userId });
      dispatch(setCartUser(userId));

      const toastPayload = {
        type: 'success',
        title: `${strings.verifiedOtp}`,
      };

      if (role === 'CUSTOMER') {
        if (returningUser) {
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
          safePush('CustomerDashboard', {
            toast: JSON.stringify(toastPayload),
          });
        } else {
          safePush('CustomerCreateProfile', {
            toast: JSON.stringify(toastPayload),
            mobile,
            role,
          });
        }
      } else {
        if (returningUser) {
          fetchStorekeeperProfile();
          safePush('StorekeeperDashboard', {
            toast: JSON.stringify(toastPayload),
          });
        } else {
          safePush('StorekeeperCreateProfile', {
            toast: JSON.stringify(toastPayload),
          });
        }
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      showToast(
        'error',
        `${strings.otpFailed}`,
        error.message || 'Something went wrong',
      );
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
            keyboardType="numeric"
            maxLength={10}
            value={mobile}
            onTextChange={text => setMobile(text.replace(/[^0-9]/g, ''))}
            textStyle={{ color: Colors.disabledText }}
          />

          <Text
            style={[
              localStyles.sendOtpText,
              sendOtpClicked
                ? localStyles.sendOtpDisabled
                : localStyles.sendOtpEnabled,
            ]}
            onPress={!sendOtpClicked ? handleSendOtp : null}
          >
            {strings.sendOtp}
          </Text>

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
            keyboardType="numeric"
            maxLength={4}
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
            <Text>{strings.havnotReceivedOtp}</Text>
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
                    ? localStyles.resendWaiting // <-- New intermediate style
                    : localStyles.resendDisabled,
                ]}
              >
                {!sendOtpClicked
                  ? `${strings.resendOtp}`
                  : canResend
                  ? `${strings.resendOtp}`
                  : strings.resendOtpAvailable(timer)}
              </Text>
            </Pressable>
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
        </View>
        <View style={localStyles.loginBtn}>
          <CustomButton
            onPress={handleLogin}
            title={strings.login}
            disabled={!otpEnabled}
          />
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
    paddingTop: '10@vs',
  },
  logo: {
    marginBottom: '32@vs',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
    paddingTop: '40@vs',
    paddingBottom: '40@vs',
    backgroundColor: Colors.white,
  },
  sendOtpText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginTop: '2@vs',
    marginBottom: '10@vs',
    marginRight: '10@ms',
  },
  sendOtpEnabled: {
    color: Colors.primary,
  },
  sendOtpDisabled: {
    color: Colors.disabledText,
    opacity: 0.5,
  },
  otpPrompt: {
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: '12@vs',
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
  resendEnabled: {
    color: Colors.primary,
  },
  resendDisabled: {
    color: Colors.disabledText,
    opacity: 0.2,
  },
  resendWaiting: {
    color: Colors.disabled,
    opacity: 0.6,
  },
  policyContainer: {
    marginTop: '20@vs',
    paddingHorizontal: '10@ms',
  },
  policyText: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: '22@vs',
  },
  underline: {
    textDecorationLine: 'underline',
    color: Colors.secondary,
  },
  loginBtn: {
    marginTop: '40@vs',
    width: '100%',
    alignItems: 'center',
  },
});
