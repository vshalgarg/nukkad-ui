import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Keyboard,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { useEffect, useRef, useState, useCallback } from 'react';
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useDialog } from '../../contexts/DialogContext';

import CustomButton from '../../components/CustomButton';
import QRScannerBox from '../../components/QRScannerBox.jsx';
import { useStore } from '../../contexts/storeContext';
import Colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import CustomInput from '../../components/CustomInput';
import { showToast } from '../../utils/toastUtils';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { addCustomerStore } from '../../services/customer/addStoreService.js';
import textStyles from '../../styles/textStyles.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';
import strings from '../../constants/string.js';
import { ScaledSheet } from 'react-native-size-matters';

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
  const route = useRoute();

  const { saveStore } = useStore();
  const { safePush } = useSafeRouter();

  const scannerRef = useRef();
  const isScanningRef = useRef(false);
  const isMountedRef = useRef(true); // ✅ declare ref

  const {showDialog}=useDialog()

  // ✅ handle mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    Keyboard.dismiss(); // 👈 Hides the keyboard when screen mounts
  }, []);

  const handleConfirm = () => {
    setDialogOpen(false);
    if (!pendingId || isSubmitting) return;
    handleAddStore(pendingId);
  };
  const handleCancel = () => {
    setDialogOpen(false);
    console.log("❌ Action cancelled");
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

      try {
        scannerRef.current?.stopCamera?.();
      } catch (e) {
        console.warn(' stopCamera failed silently', e);
      } finally {
        if (isMountedRef.current) setShowScanner(false);
      }
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

      const store = await addCustomerStore(storeQrId);
      console.log('store messages', store.message);

      if (!store?.storekeeperId) {
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
  // NEW: open confirmation dialog instead of calling API
  const onPressAddStore = async () => {
    const id = storeId.trim().toUpperCase();
    if (!id) {
      showToast('error', 'Missing Store ID', 'Please enter a valid Store ID.');
      return;
    }
    try {
      const store = await callAddStoreApi(id)
      setPendingId(id);
      setPendingStore(store?.storeName)
      Keyboard.dismiss();
      setDialogOpen(true);

    } catch (error) {
      showToast('error', "error in adding store")
    }

  };


  let callAddStoreApi = async (id) => {
    try {
      const store = await addCustomerStore(id);
      return store
    } catch (error) {
      throw error;
    }

  }

  const handleAddStore = async (id) => {
    setIsSubmitting(true);

    try {
      const store = await callAddStoreApi(id);
      console.log("adding store:", store)
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
    <View style={globalStyles.pageContainer}>
      <View style={{ height: 80 }}>
        <Text
          style={[
            textStyles.subheading,
            {
              textAlign: 'center',
              marginTop: '5%',
              textAlignVertical: 'center',
            },
          ]}
        >
          {strings.addStore}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={innerStyle.container}>
            <Text style={innerStyle.text}>{strings.addStoreViaQR}</Text>

            {showScanner && (
              <View style={innerStyle.cameraBox}>
                <QRScannerBox ref={scannerRef} onScan={handleQrCodeScanner} />
              </View>
            )}

            <Text style={innerStyle.orText}>Or</Text>

            <View style={innerStyle.manual}>
              <View style={innerStyle.StoreIdContainer}>
                <Text style={innerStyle.label}>
                  {strings.addStoreViaNumber}
                </Text>
                <CustomInput
                  style={innerStyle.inputArea}
                  placeholder="Add Store Id"
                  value={storeId}
                  onTextChange={setStoreID}
                  fixedPrefix="NKS"
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={innerStyle.btnContainer}>
        <CustomButton title={strings.addStore} onPress={onPressAddStore} disabled={isSubmitting} />
        <CustomButton title={strings.skip} onPress={handleSkip} />
      </View>
      {/* Custom popup */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        // title="Sure?"
        message={<View style={{ marginVertical: 20 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 5, fontSize: 16 }}>Store Name: {pendingStore || "-"}</Text>
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>StoreKeeperId: {pendingId || "-"}</Text>
        </View>}
        cancel="Skip"
        confirm='Add'
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
}

const { height } = Dimensions.get('window');
const boxHeight = height / 3;

const innerStyle = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10@s',
    paddingBottom: `${height * 0.15}@vs`,
  },
  text: {
    fontWeight: '600',
    fontSize: Fonts.sizes.base,
    marginBottom: '10@vs',
  },
  cameraBox: {
    height: boxHeight,
    width: boxHeight,
    borderWidth: 4,
    borderColor: Colors.primary,
    borderRadius: '12@s',
    marginBottom: '5%',
    overflow: 'hidden',
    zIndex: 1,
  },
  orText: {
    fontWeight: '700',
    fontSize: Fonts.sizes.xxl,
  },
  manual: {
    width: '100%',
    paddingHorizontal: '15%',
    marginTop: '5%',
  },
  StoreIdContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    textAlign: 'center',
    fontSize: Fonts.sizes.base,
    marginBottom: '15@vs',
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: '20@vs',
  },
});
