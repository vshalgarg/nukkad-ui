import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';

import BackButton from '../../components/BackButton';
import styles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';
import CustomAlert from '../../components/CustomAlert';

import {
  deletePaymentQR,
  fetchPaymentQRs,
  uploadQRImage,
  updatePaymentQR,
  setDefaultPaymentQR,
} from '../../services/storekeeper/PaymentQrService';

import { useAuth } from '../../contexts/authContext';
import { showToast } from '../../utils/toastUtils';
import strings from '../../constants/string';

const PaymentOptions = () => {
  const { token } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [defaultQRId, setDefaultQRId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);

  useEffect(() => {
    const loadQRs = async () => {
      try {
        const fetched = await fetchPaymentQRs(token);
        setQrCodes(fetched);
        const defaultQr = fetched.find(qr => qr.default);
        if (defaultQr) setDefaultQRId(defaultQr.id);
      } catch (err) {
        console.error('❌ Failed to load QR codes:', err);
      }
    };

    loadQRs();
  }, [token]);

  const handlePickImage = async existingQR => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });
      if (!result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        fileName: asset.fileName || 'qr.jpg',
        type: asset.type || 'image/jpeg',
      };

      let response;
      if (existingQR?.id) {
        response = await updatePaymentQR(existingQR.id, file, token);
      } else {
        response = await uploadQRImage(file, token);
      }

      if (response?.id) {
        const updatedQRs = await fetchPaymentQRs(token);
        setQrCodes(updatedQRs);
        const defaultQr = updatedQRs.find(qr => qr.default);
        if (defaultQr) setDefaultQRId(defaultQr.id);
      } else {
        showToast('error', strings.uploadFailed, strings.couldnotUploadQR);
      }
    } catch (error) {
      console.error('Image pick/upload error:', error);
      showToast('error', error.message);
    }
  };

  const handleDeleteQR = async id => {
    try {
      await deletePaymentQR(id, token);
      const updated = await fetchPaymentQRs(token);
      setQrCodes(updated);
      const defaultQr = updated.find(qr => qr.default);
      setDefaultQRId(defaultQr?.id || null);
    } catch (err) {
      console.error('❌ Delete QR failed:', err);
      showToast('error', strings.failedToDeleteQR);
    }
  };

  const handleSetDefault = async id => {
    try {
      await setDefaultPaymentQR(id, token);
      setDefaultQRId(id);
    } catch (err) {
      console.error('❌ Set default failed:', err);
      showToast('error', strings.failedTosetDefaultQR);
    }
  };

  const displaySlots = [...qrCodes];
  if (displaySlots.length < 3) displaySlots.push(null);

  return (
    <View style={styles.pageContainer}>
      <BackButton title={strings.paymentOptions} />
      <ScrollView contentContainerStyle={innerStyle.container}>
        {displaySlots.map((qr, index) => {
          const isDefault = qr?.id === defaultQRId;

          return (
            <View
              key={index}
              style={[
                innerStyle.qrCard,
                isDefault && innerStyle.qrCardSelected,
              ]}
            >
              <Text style={innerStyle.qrTitle}>
                {strings.qrCode} {index + 1}
                {isDefault ? ' (Default)' : ''}
              </Text>

              {qr?.qrImageUrl ? (
                <Image
                  source={{ uri: qr.qrImageUrl }}
                  style={innerStyle.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={innerStyle.qrPlaceholder}>
                  <Ionicons
                    name="qr-code-outline"
                    size={60}
                    color={Colors.borderColor}
                  />
                  <Text style={innerStyle.placeholderText}>
                    {strings.noQrUploaded}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={innerStyle.uploadBtn}
                onPress={() => handlePickImage(qr)}
              >
                <Feather name="upload" size={16} color={Colors.white} />
                <Text style={innerStyle.uploadBtnText}>
                  {qr?.qrImageUrl ? strings.changeQr : strings.uploadQr}
                </Text>
              </TouchableOpacity>

              {qr?.id && (
                <View style={innerStyle.actionRow}>
                  <TouchableOpacity
                    style={[
                      innerStyle.secondaryBtn,
                      {
                        backgroundColor: isDefault
                          ? Colors.borderColor
                          : Colors.secondary,
                      },
                    ]}
                    onPress={() => handleSetDefault(qr.id)}
                  >
                    <Text style={innerStyle.secondaryBtnText}>
                      {isDefault ? strings.default : strings.setDefault}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      innerStyle.secondaryBtn,
                      { backgroundColor: Colors.reject },
                    ]}
                    onPress={() => {
                      setQrToDelete(qr.id);
                      setAlertVisible(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color={Colors.white} />
                    <Text style={innerStyle.secondaryBtnText}>
                      {strings.delete}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={strings.confirmDeleteQrTitle}
        message={strings.confirmDeleteQrMessage}
        cancelText={strings.confirm}
        confirmText={strings.delete}
        onCancel={() => setAlertVisible(false)}
        onConfirm={() => {
          handleDeleteQR(qrToDelete);
          setAlertVisible(false);
        }}
      />
    </View>
  );
};

export default PaymentOptions;

const innerStyle = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  qrCardSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    elevation: 5,
    transform: [{ scale: 1.01 }],
  },
  qrTitle: {
    fontSize: Fonts.sizes.base + 2,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
    marginBottom: 14,
    objectFit: 'cover',
  },
  qrPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginBottom: 14,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: Fonts.sizes.sm,
    color: Colors.borderColor,
  },
  uploadBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: {
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
  },
});
