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
        Alert.alert('Upload Failed', 'Could not upload QR code. Try again.');
      }
    } catch (error) {
      console.error('Image pick/upload error:', error);
      Alert.alert('Error', 'Something went wrong while uploading the QR.');
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
      Alert.alert('Error', 'Failed to delete QR');
    }
  };

  const handleSetDefault = async id => {
    try {
      await setDefaultPaymentQR(id, token);
      setDefaultQRId(id);
    } catch (err) {
      console.error('❌ Set default failed:', err);
      Alert.alert('Error', 'Could not set QR as default');
    }
  };

  const displaySlots = [...qrCodes];
  if (displaySlots.length < 3) displaySlots.push(null);

  return (
    <View style={styles.pageContainer}>
      <BackButton title="Payment Options" />
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
                QR Code {index + 1}
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
                  <Text style={innerStyle.placeholderText}>No QR Uploaded</Text>
                </View>
              )}

              <TouchableOpacity
                style={innerStyle.uploadBtn}
                onPress={() => handlePickImage(qr)}
              >
                <Feather name="upload" size={16} color={Colors.bgClr} />
                <Text style={innerStyle.uploadBtnText}>
                  {qr?.qrImageUrl ? 'Change QR Code' : 'Upload QR Code'}
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
                      {isDefault ? 'Default' : 'Set as Default'}
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
                    <Feather name="trash-2" size={14} color={Colors.bgClr} />
                    <Text style={innerStyle.secondaryBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="Delete QR"
        message="Are you sure you want to delete this QR code?"
        cancelText="Cancel"
        confirmText="Delete"
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
    backgroundColor: Colors.bgClr,
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
    backgroundColor: Colors.bgClr,
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
    color: Colors.bgClr,
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
    color: Colors.bgClr,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
  },
});
