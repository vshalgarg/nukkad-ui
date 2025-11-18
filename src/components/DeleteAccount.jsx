import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import auth from '@react-native-firebase/auth';
import { sendOtp, verifyOtp } from '../services/authApi';
import { showToast } from '../utils/toastUtils';
import { useSafeRouter } from '../hooks/useSafeRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDialog } from '../contexts/DialogContext';
import strings from '../constants/string';

const DeleteAccountModal = ({ visible, phoneNumber, onCancel, onConfirm }) => {
  const [otp, setOtp] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [sendOtpClicked, setSendOtpClicked] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  const timerRef = useRef(null);
  const { safePush } = useSafeRouter();
  const { showDialog } = useDialog();

  const normalizePhone = raw => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (raw.startsWith('+')) return raw;
    return `+91${digits}`;
  };

  useEffect(() => {
    if (!sendOtpClicked || canResend) return;

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sendOtpClicked, canResend]);

  const handleSendOtp = async (isResend = false) => {
    Keyboard.dismiss();

    if (!phoneNumber) {
      showToast('error', 'No phone number', 'Phone number is required');
      return;
    }

    const phoneForFirebase = normalizePhone(phoneNumber);

    try {
      await sendOtp(phoneNumber);
      setSendOtpClicked(true);
      setOtpEnabled(true);
      setTimer(30);
      setCanResend(false);

      showToast(
        'success',
        isResend ? 'OTP Resent' : 'OTP Sent',
        `OTP ${isResend ? 'resent' : 'sent'} to ${phoneNumber}`,
      );

      const firebaseConfirmation = await auth().signInWithPhoneNumber(
        phoneForFirebase,
      );
      console.log("firebaseConfirmation",firebaseConfirmation)
      setConfirmResult(firebaseConfirmation);
    } catch (error) {
      console.error('Send OTP Error:', error);
      showToast(
        'error',
        'Failed to send OTP',
        error?.message || 'Please try again',
      );
    }
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    handleSendOtp(true);
  };

  const handleDeleteAccount = async () => {
    if (Keyboard.isVisible) Keyboard.dismiss();

    setTimeout(async () => {
      if (!otp || otp.length < 6) {
        showToast('error', strings.invalidOtp, strings.tryAgain);
        return;
      }
      setLoading(true);

      try {
        const confirmation = await confirmResult.confirm(otp);
        const firebaseToken = await confirmation.user.getIdToken();
        console.log(firebaseToken,"FirebaseToken")
        const result = await verifyOtp({
          mobile: phoneNumber,
          firebaseToken,
        });


        await AsyncStorage.clear();
        showToast('success', 'Your Account has been deleted');
        onConfirm?.();
        safePush('Home');
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete account. Try again.';

        showToast('error','Please enter a correct otp');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleCancel = () => {
    setOtp('');
    setOtpEnabled(false);
    setSendOtpClicked(false);
    setCanResend(false);
    setTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setConfirmResult(null);
    onCancel?.();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Delete Account</Text>

              <CustomInput
                label="Mobile Number"
                value={phoneNumber}
                editable={false}
                style={{ marginBottom: 10 }}
              />

              <Pressable
                onPress={sendOtpClicked ? handleResendOtp : handleSendOtp}
                disabled={sendOtpClicked && !canResend}
              >
                <Text
                  style={[
                    styles.sendOtpText,
                    sendOtpClicked && !canResend
                      ? styles.disabledText
                      : styles.activeText,
                  ]}
                >
                  {!sendOtpClicked
                    ? 'Send OTP'
                    : canResend
                    ? 'Resend OTP'
                    : `Resend in ${timer}s`}
                </Text>
              </Pressable>

              <CustomInput
                label="Enter OTP"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onTextChange={setOtp}
                keyboardType="numeric"
                maxLength={6}
                editable={otpEnabled}
                style={!otpEnabled ? { opacity: 0.6 } : {}}
              />

              <View
                style={styles.buttonRow}
                keyboardShouldPersistTaps="handled"
              >
                <CustomButton
                  title="Cancel"
                  onPress={handleCancel}
                  style={styles.cancelBtn}
                />
                <CustomButton
                  title={loading ? 'Deleting...' : 'Delete'}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleDeleteAccount();
                  }}
                  style={styles.confirmBtn}
                  disabled={loading || !otpEnabled}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DeleteAccountModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '5%',
    elevation: 4,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.secondary,
  },
  sendOtpText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  activeText: { color: Colors.primary },
  disabledText: { color: Colors.disabledText, opacity: 0.6 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    width: 140,
    backgroundColor: Colors.disabledText,
    borderColor: Colors.disabledText,
  },
  confirmBtn: {
    width: 140,
    backgroundColor: Colors.reject,
    borderColor: Colors.reject,
  },
});
