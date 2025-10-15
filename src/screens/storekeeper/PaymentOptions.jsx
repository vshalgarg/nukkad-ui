import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { ScaledSheet } from 'react-native-size-matters';

import BackButton from '../../components/BackButton';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import { useAuth } from '../../contexts/authContext';
import { showToast } from '../../utils/toastUtils';
import strings from '../../constants/string';
import { uploadImageAsync } from '../../services/firebase/firebaseConfig';
import {
  uploadQRImage,
  fetchPaymentQRs,
  deletePaymentQR,
  setDefaultPaymentQR,
} from '../../services/storekeeper/PaymentQrService';
import CustomAlert from '../../components/CustomAlert';

const PaymentOptions = () => {
  const { token } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);
  const [defaultQRId, setDefaultQRId] = useState(null);

  useEffect(() => {
    if (token) loadQRs();
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

      setUploadingIndex(index);

      const firebaseUrl = await uploadImageAsync(asset.uri, fileName);

      const response = await uploadQRImage({ qrCodes: firebaseUrl }, token);

      if (response) {
        await loadQRs();
        showToast('success', strings.uploadSuccess);
      }
    } catch (err) {
      console.error(err);
      showToast('error', strings.failedToUploadQR);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleOpenModal = uri => {
    setModalImage(uri);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalImage(null);
  };

  const handleDeleteQR = async id => {
    try {
      // Optimistically remove the QR from the state first
      setQrCodes(prev => prev.filter(qr => qr.id !== id));

      // Call backend to delete
      await deletePaymentQR(id, token);

      showToast('success', strings.deleteSuccess);
    } catch (err) {
      console.error(err);
      showToast('error', strings.failedToDeleteQR);

      // If backend fails, reload QR codes to restore state
      await loadQRs();
    }
  };

  const handleSetDefault = async id => {
    try {
      await setDefaultPaymentQR(id, token);
      await loadQRs();
      showToast('success', strings.defaultSetSuccess);
    } catch (err) {
      console.error(err);
      showToast('error', strings.failedToUpdateQR);
    }
  };
  // Only show uploaded QR images + 1 placeholder if total < 3
  const displaySlots = [...qrCodes];
  if (qrCodes.length < 3) {
    displaySlots.push(null); // exactly 1 placeholder
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <BackButton title={strings.paymentOptions} />
      <ScrollView contentContainerStyle={innerStyle.container}>
        {displaySlots.map((qr, index) => {
          const imageUrl = qr?.qrImageUrl;
          const isDefault = qr?.id === defaultQRId;

          return (
            <View key={index} style={innerStyle.qrCard}>
              <Text style={innerStyle.qrTitle}>
                {strings.qrCode} {index + 1} {isDefault ? '(Default)' : ''}
              </Text>

              {imageUrl ? (
                <TouchableOpacity
                  style={innerStyle.qrImageContainer}
                  activeOpacity={0.8}
                  onPress={() => handleOpenModal(imageUrl)}
                >
                  {uploadingIndex === index ? (
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : (
                    <Image
                      source={{ uri: imageUrl }}
                      style={innerStyle.qrImage}
                      resizeMode="contain"
                      blurRadius={8}
                    />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={innerStyle.qrPlaceholder}
                  onPress={() => handlePickImage(index)}
                  disabled={uploadingIndex === index}
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

              {imageUrl && (
                <View style={innerStyle.actionRow}>
                  {/* Set Default Button */}
                  <TouchableOpacity
                    style={[
                      innerStyle.secondaryBtn,
                      {
                        backgroundColor: isDefault
                          ? Colors.borderColor
                          : Colors.primary,
                      },
                    ]}
                    onPress={() => handleSetDefault(qr.id)}
                  >
                    <Text style={innerStyle.secondaryBtnText}>
                      {isDefault ? strings.default : strings.setDefault}
                    </Text>
                  </TouchableOpacity>

                  {/* Delete Button – only show if NOT default */}
                  {!isDefault && (
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
                  )}
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

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable
          style={innerStyle.modalBackground}
          onPress={handleCloseModal}
        >
          <Image
            source={{ uri: modalImage }}
            style={innerStyle.modalImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
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
  qrTitle: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '12@ms',
  },
  qrImageContainer: {
    width: '200@ms',
    height: '200@ms',
    borderRadius: '12@ms',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F9F9F9',
    marginBottom: '14@ms',
  },
  qrImage: {
    width: '180@ms',
    height: '180@ms',
    borderRadius: '12@ms',
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
    borderRadius: '50@ms',
  },
  secondaryBtnText: {
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    borderRadius: '12@ms',
  },
});
