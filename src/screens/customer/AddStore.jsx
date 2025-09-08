import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  Dimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import QRScannerBox from '../../components/QRScannerBox';
import ConfirmDialog from '../../components/ConfirmDialog';

import { useDialog } from '../../contexts/DialogContext';
import { useStore } from '../../contexts/storeContext';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import useBackHandlerControl from '../../hooks/useBackHandlerControl';
import { addCustomerStore } from '../../services/customer/addStoreService';

import { showToast } from '../../utils/toastUtils';
import globalStyles from '../../styles/globalStyles';
import textStyles from '../../styles/textStyles';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import strings from '../../constants/string';

const { height } = Dimensions.get('window');
const STORAGE_KEY = '@scanned_stores';

export default function AddStore() {
  useBackHandlerControl({ blockBack: true });

  const navigation = useNavigation();
  const route = useRoute();

  const [storeId, setStoreID] = useState('');
  const [showScanner, setShowScanner] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [pendingStore, setPendingStore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scannerRef = useRef();
  const isScanningRef = useRef(false);
  const isMountedRef = useRef(true);

  const { saveStore } = useStore();
  const { safePush } = useSafeRouter();
  const { showDialog } = useDialog();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

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

  const callAddStoreApi = async id => {
    try {
      return await addCustomerStore(id);
    } catch (error) {
      throw error;
    }
  };

  const handleAddStore = async id => {
    setIsSubmitting(true);
    try {
      const store = await callAddStoreApi(id);
      await persistStoreIfNew(store);
      saveStore(store);
      await AsyncStorage.setItem('@selected_store', JSON.stringify(store));

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrCodeScanner = async e => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      let storeQrId;
      try {
        const parsedData = JSON.parse(e.data);
        storeQrId = parsedData?.storeQrId;
      } catch {
        storeQrId = e.data;
      }

      if (!storeQrId) {
        showToast('error', strings.invalidQr, strings.invalidQr2);
        return;
      }

      const store = await callAddStoreApi(storeQrId);
      setPendingId(storeQrId);
      setPendingStore(store.storeName);
      setDialogOpen(true);
    } catch (err) {
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
      const store = await callAddStoreApi(id);
      setPendingId(id);
      setPendingStore(store?.storeName);
      Keyboard.dismiss();
      setDialogOpen(true);
    } catch (error) {
      showToast('error', strings.failedToAddStore, error?.message);
    }
  };

  const handleSkip = () => {
    stopCameraAndNavigate(() => navigation.navigate('CustomerDashboard'));
  };

  const handleConfirm = () => {
    setDialogOpen(false);
    if (!pendingId || isSubmitting) return;
    handleAddStore(pendingId);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <View style={globalStyles.pageContainer}>
      <View style={styles.header}>
        <Text style={textStyles.subheading}>{strings.addStore}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.text}>{strings.addStoreViaQR}</Text>

          {showScanner && (
            <View style={styles.cameraBox}>
              <QRScannerBox ref={scannerRef} onScan={handleQrCodeScanner} />
            </View>
          )}

          <Text style={styles.orText}>Or</Text>

          <View style={styles.manualInput}>
            <Text style={styles.label}>{strings.addStoreViaNumber}</Text>
            <CustomInput
              style={styles.inputArea}
              placeholder="Add Store Id"
              value={storeId}
              onTextChange={setStoreID}
              fixedPrefix="NKS"
              maxLength={14}
              keyboardType="number-pad"
              inputAccessoryViewID="StoreId"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed button bar at the bottom */}
      <View style={styles.btnContainer}>
        <CustomButton
          title={strings.addStore}
          onPress={onPressAddStore}
          disabled={isSubmitting}
        />
        <CustomButton title={strings.skip} onPress={handleSkip} />
      </View>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        message={
          <View style={{ marginVertical: 20 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 16 }}>
              Store Name: {pendingStore || '-'}
            </Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
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

const boxHeight = height / 3;

const styles = StyleSheet.create({
  header: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  text: {
    fontWeight: '600',
    fontSize: Fonts.sizes.base,
    marginVertical: 10,
  },
  cameraBox: {
    height: boxHeight,
    width: boxHeight,
    borderWidth: 4,
    borderColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 30,
    overflow: 'hidden',
  },
  orText: {
    fontWeight: '700',
    fontSize: Fonts.sizes.xxl,
    marginVertical: 10,
  },
  manualInput: {
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    textAlign: 'center',
    fontSize: Fonts.sizes.base,
    marginBottom: 15,
  },
  inputArea: {
    width: '100%',
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
