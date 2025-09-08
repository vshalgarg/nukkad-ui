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
import { ScaledSheet } from 'react-native-size-matters';

const PaymentOptions = () => {
  const { token } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [defaultQRId, setDefaultQRId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);
  const [previewImages, setPreviewImages] = useState({});

  useEffect(() => {
    loadQRs();
  }, [token]);

  const loadQRs = async () => {
    try {
      const fetched = await fetchPaymentQRs(token);
      setQrCodes(fetched);
      const defaultQr = fetched.find(qr => qr.default);
      if (defaultQr) setDefaultQRId(defaultQr.id);
    } catch (err) {
      console.error('Failed to load QR codes:', err);
    }
  };

  const handlePickImage = async index => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });
      if (!result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      setPreviewImages(prev => ({ ...prev, [index]: asset }));
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  const handleUploadImage = async (index, existingQR) => {
    try {
      const asset = previewImages[index];
      if (!asset) return;
      const file = {
        uri: asset.uri,
        fileName: asset.fileName || 'qr.jpg',
        type: asset.type || 'image/jpeg',
      };

      const response = existingQR?.id
        ? await updatePaymentQR(existingQR.id, file, token)
        : await uploadQRImage(file, token);

      if (response?.id) {
        await loadQRs();
        setPreviewImages(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      } else {
        showToast('error', strings.uploadFailed, strings.couldnotUploadQR);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      showToast('error', error.message);
    }
  };

  const handleDeleteQR = async id => {
    try {
      await deletePaymentQR(id, token);
      await loadQRs();
    } catch (err) {
      console.error('Delete QR failed:', err);
      showToast('error', strings.failedToDeleteQR);
    }
  };

  const handleSetDefault = async id => {
    try {
      await setDefaultPaymentQR(id, token);
      setDefaultQRId(id);
    } catch (err) {
      console.error(' Set default failed:', err);
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
          const preview = previewImages[index];
          const imageUrl = preview?.uri || qr?.qrImageUrl;

          return (
            <View
              key={index}
              style={[
                innerStyle.qrCard,
                isDefault && innerStyle.qrCardSelected,
              ]}
            >
              <Text style={innerStyle.qrTitle}>
                {strings.qrCode} {index + 1} {isDefault ? '(Default)' : ''}
              </Text>

              {imageUrl ? (
                <View style={innerStyle.qrImageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={innerStyle.qrImage}
                    resizeMode="contain"
                  />
                  {preview && (
                    <TouchableOpacity
                      style={innerStyle.removeIcon}
                      onPress={() => {
                        setPreviewImages(prev => {
                          const updated = { ...prev };
                          delete updated[index];
                          return updated;
                        });
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={Colors.reject}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={innerStyle.qrPlaceholder}
                  onPress={() => handlePickImage(index)}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={60}
                    color={Colors.secondary}
                  />
                  <Text style={innerStyle.placeholderText}>
                    {strings.selectQr}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  innerStyle.uploadBtn,
                  !previewImages[index] &&
                    !qr?.qrImageUrl && { backgroundColor: Colors.borderColor },
                ]}
                onPress={() => handleUploadImage(index, qr)}
                disabled={!previewImages[index] && !qr?.qrImageUrl}
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

const innerStyle = ScaledSheet.create({
  container: {
    padding: '20@ms',
    paddingBottom: '40@ms',
  },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: '18@ms',
    padding: '16@ms',
    marginBottom: '24@ms',
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
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '12@ms',
  },
  qrImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '14@ms',
    width: '200@ms',
    height: '200@ms',
    borderRadius: '12@ms',
    borderColor: Colors.borderColor,
    borderWidth: 1,
  },
  qrImage: {
    width: '180@ms',
    height: '180@ms',
    backgroundColor: Colors.white,
  },
  removeIcon: {
    position: 'absolute',
    top: '-10@ms',
    right: '-10@ms',
    backgroundColor: Colors.white,
    borderRadius: '30@ms',
    elevation: 3,
    padding: '1@ms',
  },
  qrPlaceholder: {
    height: '200@ms',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginBottom: '14@ms',
  },
  placeholderText: {
    marginTop: '8@ms',
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  uploadBtn: {
    flexDirection: 'row',
    gap: '8@ms',
    backgroundColor: Colors.primary,
    paddingVertical: '10@ms',
    borderRadius: '8@ms',
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
    marginTop: '14@ms',
    gap: '12@ms',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: '6@ms',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10@ms',
    borderRadius: '8@ms',
  },
  secondaryBtnText: {
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
  },
});
