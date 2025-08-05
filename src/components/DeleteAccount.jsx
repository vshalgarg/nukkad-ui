import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import CustomInput from './CustomInput';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { sendOtp, verifyOtp } from '../services/authApi';
import { showToast } from '../utils/toastUtils';
import CustomButton from '../components/CustomButton';
import { deleteAccount } from '../services/common/deleteAccountService';
import { useSafeRouter } from '../hooks/useSafeRouter';
const DeleteAccountModal = ({ visible, phoneNumber, onCancel, onConfirm }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef(null);
  const { safePush } = useSafeRouter();

  useEffect(() => {
    if (cooldown > 0) {
      intervalRef.current = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    } else {
      clearTimeout(intervalRef.current);
    }
    return () => clearTimeout(intervalRef.current);
  }, [cooldown]);

  const handleSendOtp = async () => {
    try {
      await sendOtp(phoneNumber);
      setOtpSent(true);
      setCooldown(30); // 30-second lockout
      showToast('success', 'OTP Sent', `OTP has been sent to ${phoneNumber}`);
    } catch (err) {
      showToast(
        'error',
        'Failed to send OTP',
        err?.message || 'Please try again',
      );
    }
  };

  const handleDelete = async () => {
    Keyboard.dismiss();

    setTimeout(async () => {
      if (otp.length !== 4) {
        Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
        return;
      }
      try {
        setLoading(true);
        const data = await verifyOtp(phoneNumber, otp);

        if (!data?.token) {
          Alert.alert('Invalid OTP', 'The OTP you entered is incorrect.');
          return;
        }

        await deleteAccount(data.token);
        onConfirm();

        try {
          safePush('Home');
        } catch (navError) {
          console.error('Navigation error:', navError);
          showToast('error', 'Navigation failed', 'Please restart the app');
        }
      } catch (error) {
        console.error('Verification or deletion failed:', error);
        Alert.alert(
          'Error',
          error?.message || 'Something went wrong. Try again.',
        );
      } finally {
        setLoading(false);
      }
    }, 150);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Delete Account</Text>

            <View style={styles.customInput}>
              <View>
                <CustomInput
                  label="Mobile Number"
                  value={phoneNumber}
                  editable={false}
                  style={styles.input}
                />
                <Pressable onPress={handleSendOtp} disabled={cooldown > 0}>
                  <Text
                    style={[
                      styles.sendOtpText,
                      cooldown > 0 ? styles.disabledText : styles.activeText,
                    ]}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
                  </Text>
                </Pressable>
              </View>
              <CustomInput
                label="Enter OTP"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onTextChange={text => setOtp(text)}
                keyboardType="numeric"
                maxLength={4}
                style={styles.input}
              />
            </View>

            <View style={styles.buttonRow}>
              <CustomButton
                onPress={() => {
                  setOtp('');
                  setOtpSent(false);
                  setCooldown(0);
                  clearTimeout(intervalRef.current);
                  onCancel();
                }}
                style={styles.cancelBtn}
                title="Cancel"
              />

              <CustomButton
                onPress={handleDelete}
                style={styles.confirmBtn}
                title={loading ? 'Deleting...' : 'Delete'}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    padding: 20,
    elevation: 4,
  },
  customInput: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sendOtpText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  activeText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.disabledText,
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  cancelBtn: {
    backgroundColor: Colors.disabledText,
    paddingVertical: 10,
    borderColor: Colors.disabledText,
  },
  confirmBtn: {
    backgroundColor: Colors.reject,
    borderColor: Colors.reject,
  },
  cancelText: {
    color: '#000',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
