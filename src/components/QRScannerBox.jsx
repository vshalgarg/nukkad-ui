import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { showToast } from '../utils/toastUtils';
import Fonts from '../styles/font';
import Colors from '../styles/colors';
import useBackHandlerControl from '../hooks/useBackHandlerControl';

const QRScannerBox = forwardRef(({ onScan }, ref) => {
  useBackHandlerControl({ blockBack: true });

  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef();

  useImperativeHandle(ref, () => ({
    stopCamera: () => {
      console.log('stopCamera called');
      // No direct stop method in CameraKit → unmount <Camera /> to stop
    },
  }));

  // Reset scan lock after 1s
  useEffect(() => {
    if (scanned) {
      const timer = setTimeout(() => setScanned(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [scanned]);

  // Request permissions
  useEffect(() => {
    let isMounted = true;

    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'App needs access to your camera to scan QR codes.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
          } else {
            showToast('error', 'Camera permission denied');
          }
        } catch (err) {
          console.warn('Android permission error:', err);
          showToast('error', 'Failed to request permission');
        }
      } else {
        // iOS
        try {
          let status;
          try {
            status = await Camera.checkDeviceCameraAuthorizationStatus();
            console.log('Camera status:', status);
          } catch (err) {
            console.warn('checkDeviceCameraAuthorizationStatus threw:', err);
            // fallback → treat as undetermined
            status = -1;
          }

          if (status === true) {
            setHasPermission(true);
          } else if (status === -1) {
            try {
              console.log('About to request camera auth');
              const granted = await Camera.requestDeviceCameraAuthorization();
              console.log('Request result:', granted);
              setHasPermission(granted);
              if (!granted) {
                showToast('error', 'Camera permission denied');
              }
            } catch (err) {
              console.warn('requestDeviceCameraAuthorization threw:', err);
              showToast('error', 'Camera permission denied');
            }
          } else {
            showToast('error', 'Camera permission denied');
          }
        } catch (err) {
          console.warn('Unexpected iOS permission error:', err);
          showToast('error', 'Failed to request permission');
        }
      }
    };

    requestCameraPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBarcodeScanned = event => {
    if (scanned) return;
    setScanned(true);
    const data = event?.nativeEvent?.codeStringValue;
    if (onScan) {
      onScan({ data });
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionFallback}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes.
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraBox}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        cameraType="back"
        scanBarcode={true}
        onReadCode={handleBarcodeScanned}
      />
    </View>
  );
});

export default QRScannerBox;

const styles = StyleSheet.create({
  cameraBox: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  permissionFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  permissionText: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: Fonts.sizes.base,
    marginBottom: 16,
  },
  settingsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
});
