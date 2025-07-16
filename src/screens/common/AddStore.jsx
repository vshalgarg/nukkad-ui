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
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import { useEffect, useRef, useState, useCallback } from 'react';

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

const STORAGE_KEY = '@scanned_stores';

export default function AddStore() {
  useBackHandlerControl({ blockBack: true });
  const [storeId, setStoreID] = useState('');
  const [showScanner, setShowScanner] = useState(true);

  const navigation = useNavigation();
  const route = useRoute();
  const hideBack = route.params?.hideBackButton;

  const { saveStore } = useStore();
  const { safePush } = useSafeRouter();

  const scannerRef = useRef();
  const isScanningRef = useRef(false);
  const isMountedRef = useRef(true); // ✅ declare ref

  // ✅ handle mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        console.warn('⚠️ stopCamera failed silently', e);
      } finally {
        if (isMountedRef.current) setShowScanner(false);
      }
    });
  };

  useFocusEffect(
  useCallback(() => {
    setShowScanner(true);

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log('🚫 Hardware back disabled on AddStore');
        return true; // prevents crash
      }
    );

    return () => backHandler.remove();
  }, [])
);


  const handleBarcodeScanned = async e => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      const parsedData = JSON.parse(e.data);
      const storeQrId = parsedData?.storeQrId;

      if (!storeQrId || !/^STR\d+$/.test(storeQrId)) {
        showToast('error', 'Invalid QR Code', 'Missing or invalid storeQrId');
        return;
      }

      const store = await addCustomerStore(storeQrId);

      if (!store?.storekeeperId) {
        stopCameraAndNavigate(() => safePush('CustomerDashboard'));
        return;
      }

      await persistStoreIfNew(store);
      saveStore(store); // ✅ Sets as default

      stopCameraAndNavigate(() =>
        safePush('CustomerDashboard', { scannedData: store }),
      );
    } catch (err) {
      console.error('❌ QR Scan Error:', err);
      const message =
        err?.response?.data?.message || err.message || 'Invalid QR';
      showToast('error', 'Failed to Add Store', message);
    } finally {
      isScanningRef.current = false;
    }
  };

  const handleAddStore = async () => {
    const id = storeId.trim().toUpperCase();

    try {
      const store = await addCustomerStore(id);
      await persistStoreIfNew(store);
      saveStore(store);

      if (!store?.storekeeperId) {
        stopCameraAndNavigate(() => navigation.navigate('CustomerDashboard'));
        return;
      }

      stopCameraAndNavigate(() =>
        safePush('CustomerDashboard', { scannedData: store }),
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || 'Store addition failed';
      showToast('error', 'Failed to Add Store', message);
    }
  };
  const handleSkip = () => {
    stopCameraAndNavigate(() => {
      navigation.navigate('CustomerDashboard');
    });
  };

  const handleBackPress = () => {
    const canGoBack = navigation.canGoBack?.();
    stopCameraAndNavigate(() => {
      if (canGoBack) navigation.goBack();
      else safePush('CustomerDashboard');
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
          Add Store
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={innerStyle.container}>
            <Text style={innerStyle.text}>Scan QR to Add Store</Text>

            {showScanner && (
              <View style={innerStyle.cameraBox}>
                <QRScannerBox ref={scannerRef} onScan={handleBarcodeScanned} />
              </View>
            )}

            <Text style={innerStyle.orText}>Or</Text>

            <View style={innerStyle.manual}>
              <View style={innerStyle.StoreIdContainer}>
                <Text style={innerStyle.label}>Add Store Manually By Id</Text>
                <CustomInput
                  placeholder="Add Store Id"
                  value={storeId}
                  onTextChange={setStoreID}
                  fixedPrefix="STR"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={innerStyle.btnContainer}>
        <CustomButton title="Add Store" onPress={handleAddStore} />
        <CustomButton title="Skip" onPress={handleSkip} />
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');
const boxHeight = height / 3;

const innerStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgClr,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: height * 0.15,
  },
  text: {
    fontWeight: '600',
    fontSize: Fonts.sizes.base,
    marginBottom: 10,
  },
  cameraBox: {
    height: boxHeight,
    width: boxHeight,
    borderWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 12,
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
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: Fonts.sizes.base,
    marginBottom: 15,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});
