import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useAuth } from '../../contexts/authContext';
import { fetchPaymentQRs } from '../../services/storekeeper/PaymentQrService';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import BackButton from '../../components/BackButton';
import { showToast } from '../../utils/toastUtils';

const StorekeeperQRCode = () => {
  const { token } = useAuth();
  const [defaultQR, setDefaultQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (token) loadDefaultQR();
  }, [token]);

  const loadDefaultQR = async () => {
    try {
      const fetched = await fetchPaymentQRs(token);
      const found = fetched.find(qr => qr.default === true);
      setDefaultQR(found || null);
    } catch (err) {
      console.error('Failed to fetch QR codes:', err);
      showToast('error', 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton title="My QR Code" />
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 60 }}
        />
      ) : defaultQR ? (
        <View style={styles.content}>
          <Text style={styles.title}>Default Payment QR</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsModalVisible(true)}
          >
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: defaultQR.qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.note}>Tap QR to enlarge</Text>

          <Modal
            visible={isModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={styles.modalBackground}
                onPress={() => setIsModalVisible(false)}
              />
              <View style={styles.modalContent}>
                <Image
                  source={{ uri: defaultQR.qrImageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <Text style={styles.noQRText}>No default QR found</Text>
      )}
    </View>
  );
};

export default StorekeeperQRCode;

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: '50@vs',
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '20@vs',
  },
  qrContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: '20@ms',
    padding: '20@ms',
    elevation: 4,
  },
  qrImage: {
    width: '200@ms',
    height: '200@ms',
    borderRadius: '12@ms',
  },
  note: {
    marginTop: '16@ms',
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
  },
  noQRText: {
    marginTop: '80@vs',
    fontSize: Fonts.sizes.base,
    color: Colors.secondaryText,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: '20@vs',
    right: '20@ms',
    zIndex: 2,
  },
});
