import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
import {
  uploadImageAsync,
  deleteImageAsync,
} from '../../services/firebase/firebaseConfig';

const PaymentOptions = () => {
  const { token } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [defaultQRId, setDefaultQRId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);
  const [previewImages, setPreviewImages] = useState({});
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    if (token) {
      loadQRs();
    }
  }, [token]);

  const loadQRs = async () => {
    try {
      const fetched = await fetchPaymentQRs(token);
      setQrCodes(fetched);
      const defaultQr = fetched.find(qr => qr.default);
      setDefaultQRId(defaultQr?.id || null);
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
      const fileName = asset.fileName || `qr_${Date.now()}.jpg`;

      // Show loader
      setUploadingIndex(index);

      // Upload to Firebase (loader stays until this completes)
      const firebaseUrl = await uploadImageAsync(asset.uri, fileName);

      // Save preview
      setPreviewImages(prev => ({
        ...prev,
        [index]: { ...asset, firebaseUrl, fileName },
      }));

      // Directly upload to backend
      await handleUploadImage(index, qrCodes[index]);
    } catch (error) {
      console.error('Image pick error:', error);
      showToast('error', error.message);
    } finally {
      // Remove loader only after Firebase + backend upload completes
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = async index => {
    try {
      const asset = previewImages[index];
      if (asset?.fileName) {
        await deleteImageAsync(asset.fileName).catch(() =>
          console.log('Firebase delete skipped'),
        );
      }
    } catch (err) {
      console.error('Firebase delete failed:', err);
    } finally {
      setPreviewImages(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const handleUploadImage = async (index, existingQR) => {
    try {
      const asset = previewImages[index];
      if (!asset?.firebaseUrl) return;

      const payload = { qrCodes: asset.firebaseUrl };

      const response = existingQR?.id
        ? await updatePaymentQR(existingQR.id, payload, token) // update existing
        : await uploadQRImage(payload, token); // new QR

      if (response) {
        if (existingQR?.id) {
          // Update existing QR in state (no flicker)
          setQrCodes(prev => {
            const updated = [...prev];
            updated[index] = { ...existingQR, qrImageUrl: asset.firebaseUrl };
            return updated;
          });
        } else {
          // New QR → reload from backend to get ID etc.
          await loadQRs();
        }

        // Remove preview
        setPreviewImages(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });

        showToast('success', strings.uploadSuccess);
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
      await loadQRs();
    } catch (err) {
      console.error('Set default failed:', err);
      showToast('error', strings.failedToUpdateQR);
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
          const imageUrl = preview?.firebaseUrl || qr?.qrImageUrl;

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
                  {uploadingIndex === index ? (
                    // Loader dikhega jab image upload ho rahi ho
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : (
                    <Image
                      source={{ uri: imageUrl }}
                      style={innerStyle.qrImage}
                      resizeMode="contain"
                    />
                  )}

                  {/* Remove icon sirf tab dikhe jab upload complete ho */}
                  {preview && uploadingIndex !== index && (
                    <TouchableOpacity
                      style={innerStyle.removeIcon}
                      onPress={() => handleRemoveImage(index)}
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
                  disabled={uploadingIndex === index} // pick image button disable during upload
                >
                  {uploadingIndex === index ? (
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="qr-code-outline"
                        size={60}
                        color={Colors.secondary}
                      />
                      <Text style={innerStyle.placeholderText}>
                        {strings.selectQr}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {!previewImages[index]?.firebaseUrl && !qr?.qrImageUrl && (
                <TouchableOpacity
                  style={[
                    innerStyle.uploadBtn,
                    { backgroundColor: Colors.borderColor },
                  ]}
                  disabled
                >
                  <Feather name="upload" size={16} color={Colors.white} />
                  <Text style={innerStyle.uploadBtnText}>
                    {strings.uploadQr}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Upload new QR (for newly picked image) */}
              {previewImages[index]?.firebaseUrl && (
                <TouchableOpacity
                  style={innerStyle.uploadBtn}
                  onPress={async () => await handleUploadImage(index, qr)}
                  disabled={uploadingIndex === index}
                >
                  <Feather name="upload" size={16} color={Colors.white} />
                  <Text style={innerStyle.uploadBtnText}>
                    {strings.uploadQr}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Change QR (for already uploaded QR) */}
              {!previewImages[index]?.firebaseUrl && qr?.qrImageUrl && (
                <TouchableOpacity
                  style={[
                    innerStyle.uploadBtn,
                    uploadingIndex === index
                      ? { backgroundColor: Colors.borderColor }
                      : {},
                  ]}
                  onPress={async () => await handlePickImage(index)}
                  disabled={uploadingIndex === index}
                >
                  <Feather name="upload" size={16} color={Colors.white} />
                  <Text style={innerStyle.uploadBtnText}>
                    {strings.changeQr}
                  </Text>
                </TouchableOpacity>
              )}

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
        cancelText={strings.cancel}
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
