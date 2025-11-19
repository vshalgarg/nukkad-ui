import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dimensions,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  InteractionManager,
  Keyboard,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import RNQRGenerator from 'rn-qr-generator';
import CustomButton from '../../components/CustomButton';
import QRScannerBox from '../../components/QRScannerBox.jsx';
import { useStore } from '../../contexts/storeContext';
import Colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import CustomInput from '../../components/CustomInput';
import { showToast } from '../../utils/toastUtils';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import useKeyboardStatus from '../../hooks/useKeyboardStatus';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  addCustomerStore,
  getStoreById,
} from '../../services/customer/addStoreService.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';
import strings from '../../constants/string.js';
import { ScaledSheet } from 'react-native-size-matters';
import Entypo from 'react-native-vector-icons/Entypo';
import ImageResizer from 'react-native-image-resizer';

const STORAGE_KEY = '@scanned_stores';

export default function AddStore() {
  useBackHandlerControl({ blockBack: true });
  const [storeId, setStoreID] = useState('');
  const [showScanner, setShowScanner] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [pendingStore, setPendingStore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();

  const isKeyboardVisible = useKeyboardStatus();

  const { saveStore } = useStore();
  const { safePush } = useSafeRouter();

  const scannerRef = useRef();
  const isScanningRef = useRef(false);
  const isMountedRef = useRef(true);

  const route = useRoute();
  const hideBackButton = route?.params?.hideBackButton || false;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  const handleConfirm = () => {
    setDialogOpen(false);
    if (!pendingId || isSubmitting) return;
    handleAddStore(pendingId);
  };
  const handleCancel = () => {
    setDialogOpen(false);
    console.log(' Action cancelled');
  };

  const pickQrFromGallery = async () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode)
          return showToast('error', 'Failed to pick image');

        const uri = response.assets?.[0]?.uri;
        if (!uri) return showToast('error', 'No image selected');

        try {
          const tiny = await ImageResizer.createResizedImage(
            uri,
            150, 
            150, 
            'JPEG',
            60,
            0,
          );

          const fastCheck = await RNQRGenerator.detect({ uri: tiny.uri });

          if (!fastCheck.values || fastCheck.values.length === 0) {
            return showToast('error', 'No QR code found in the image');
          }

          const qrData = fastCheck.values[0];

          if (!qrData.startsWith('NKS')) {
            return showToast('error', 'Please scan a valid QR code');
          }

          handleQrCodeScanner({ data: qrData });
        } catch (err) {
          console.log('QR detect error:', err);
          showToast('error', 'Failed to read QR code from image');
        }
      },
    );
  };

  const persistStoreIfNew = async store => {
    if (!store?.storekeeperId) return;

    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    const savedStores = jsonValue ? JSON.parse(jsonValue) : [];

    const exists = savedStores.some(
      s => s.storekeeperId === store.storekeeperId,
    );

    if (!exists) {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...savedStores, store]),
      );
    }
  };

  const stopCameraAndNavigate = callback => {
    callback?.();

    InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current) return;

      const delay = 300;
      setTimeout(() => {
        try {
          scannerRef.current?.stopCamera?.();
        } catch (e) {
          console.warn('stopCamera failed silently', e);
        } finally {
          if (isMountedRef.current) setShowScanner(false);
        }
      }, delay);
    });
  };

  const handleQrCodeScanner = async e => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      let storeQrId;

      try {
        const parsedData = JSON.parse(e.data);
        storeQrId = parsedData?.storeQrId;
      } catch (err) {
        storeQrId = e.data;
      }

      if (!storeQrId) {
        showToast('error', strings.invalidQr, strings.invalidQr2);
        return;
      }
      const store = await getStoreById(storeQrId);
      if (!store?.storeQrId) {
        console.log('reTURNING FROM THSI');

        stopCameraAndNavigate(() => safePush('CustomerDashboard'));
        return;
      }
      setPendingId(storeQrId);
      setPendingStore(store.storeName);
      setDialogOpen(true);
    } catch (err) {
      console.error('QR Scan Error:', err);
      const message =
        err?.response?.data?.message || err.message || 'Invalid QR';
      showToast('error', strings.failedToAddStore, message);
    } finally {
      isScanningRef.current = false;
      setIsSubmitting(false);
    }
  };
  const onPressAddStore = async () => {
    const id = storeId.trim().toUpperCase();
    if (!id) {
      showToast('error', 'Missing Store ID', 'Please enter a valid Store ID.');
      return;
    }
    try {
      const store = await getStoreById(id);
      setPendingId(id);
      setPendingStore(store?.storeName);
      Keyboard.dismiss();
      setDialogOpen(true);
    } catch (error) {
      showToast('error', 'Enter a valid store id');
    }
  };

  let callAddStoreApi = async id => {
    try {
      const store = await addCustomerStore(id);
      return store;
    } catch (error) {
      throw error;
    }
  };

  const handleAddStore = async id => {
    setIsSubmitting(true);

    try {
      const store = await callAddStoreApi(id);
      console.log('adding store:', store);
      await persistStoreIfNew(store);
      saveStore(store);
      await AsyncStorage.setItem('@selected_store', JSON.stringify(store));
      if (!store?.storekeeperId) {
        stopCameraAndNavigate(() => navigation.navigate('CustomerDashboard'));
        return;
      }

      const toastPayload = {
        type: 'success',
        title: store.message || strings.addedStoreSuccessfully,
      };

      stopCameraAndNavigate(() =>
        safePush('CustomerDashboard', {
          toast: JSON.stringify(toastPayload),
        }),
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || 'Store addition failed';
      showToast('error', strings.failedToAddStore, message);
    }
  };
  const handleSkip = () => {
    stopCameraAndNavigate(() => {
      navigation.navigate('CustomerDashboard');
    });
  };

  return (
    <View style={[{ flex: 1 }, globalStyles.pageContainer]}>
      {/* HEADER */}
      <View style={innerStyle.headerWrapper}>
        {!hideBackButton && (
          <Pressable onPress={handleSkip} style={innerStyle.backButton}>
            <Entypo name="chevron-left" size={26} color={Colors.secondary} />
          </Pressable>
        )}

        <Text style={innerStyle.headerTitle}>{strings.addStore}</Text>
      </View>

      {/* BODY */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={innerStyle.screenWrapper}>
            {/* --- QR SCAN BOX --- */}
            <View style={innerStyle.block}>
              <Text style={innerStyle.blockTitle}>{strings.addStoreViaQR}</Text>

              {showScanner && (
                <View style={innerStyle.cameraCard}>
                  <QRScannerBox ref={scannerRef} onScan={handleQrCodeScanner} />
                </View>
              )}

              <Text style={innerStyle.orLine}>OR</Text>

              <TouchableOpacity
                onPress={pickQrFromGallery}
                style={innerStyle.galleryButton}
                activeOpacity={0.85}
              >
                <Entypo name="image" size={22} color={Colors.primary} />
                <Text style={innerStyle.galleryText}>
                  Select QR from Gallery
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={innerStyle.orLine}>OR</Text>

            {/* --- MANUAL STORE ID --- */}
            <View style={innerStyle.manualBlock}>
              <Text style={innerStyle.blockTitle}>
                {strings.addStoreViaNumber}
              </Text>

              <CustomInput
                placeholder="Enter Store ID"
                value={storeId}
                onTextChange={setStoreID}
                fixedPrefix="NKS"
                keyboardType="default"
                maxLength={14}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- BOTTOM BUTTONS --- */}
      {!isKeyboardVisible && (
        <View
          style={[
            innerStyle.footer,
            !hideBackButton && { justifyContent: 'center' }, // center only when skip is hidden
          ]}
        >
          <CustomButton title={strings.addStore} onPress={onPressAddStore} />

          {hideBackButton && (
            <CustomButton title={strings.skip} onPress={handleSkip} />
          )}
        </View>
      )}

      {/* --- CONFIRM DIALOG --- */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        message={
          <View style={{ marginVertical: 20 }}>
            <Text style={innerStyle.dialogText}>
              Store Name: {pendingStore || '-'}
            </Text>
            <Text style={innerStyle.dialogText}>
              StoreKeeperId: {pendingId || '-'}
            </Text>
          </View>
        }
        cancel="Skip"
        confirm="Add"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
}

const { height } = Dimensions.get('window');
const boxHeight = height / 3;
const innerStyle = ScaledSheet.create({
  headerWrapper: {
    height: '80@vs',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 5,
  },

  headerTitle: {
    fontSize: Fonts.sizes.xl,
    color: Colors.secondary,
    fontWeight: '700',
    opacity: 0.9,
  },

  screenWrapper: {
    alignItems: 'center',
    paddingTop: '10@vs',
    gap: '20@s',
  },

  block: {
    width: '90%',
    backgroundColor: '#fff',
    paddingVertical: '20@vs',
    paddingHorizontal: '15@s',
    borderRadius: '18@s',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,

    alignItems: 'center',
  },

  manualBlock: {
    width: '90%',
    backgroundColor: '#fff',
    padding: '20@s',
    borderRadius: '18@s',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 4,
  },

  blockTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: '15@vs',
  },

  cameraCard: {
    height: Dimensions.get('window').height / 3,
    width: Dimensions.get('window').height / 3,
    borderRadius: '22@s',
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },

  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@s',
    paddingVertical: '14@vs',
    paddingHorizontal: '22@s',
    backgroundColor: '#F2F4F8',
    borderRadius: '15@s',
  },

  galleryText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },

  orLine: {
    marginVertical: '12@vs',
    color: Colors.secondary,
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    opacity: 0.5,
  },

  footer: {
    padding: '16@s',
    backgroundColor: '#E9EDF6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dialogText: {
    fontWeight: '700',
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
    marginBottom: 6,
  },
});
