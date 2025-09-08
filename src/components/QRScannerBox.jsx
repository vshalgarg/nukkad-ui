import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';

const QRScanner = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS
        const status = await Camera.checkDeviceCameraAuthorizationStatus();
        console.log('Camera status:', status);
        if (status === true) {
          setHasPermission(true);
        } else {
          const granted = await Camera.requestDeviceCameraAuthorization();
          console.log('Request result:', granted);
          setHasPermission(granted);
        }
      }
    };

    requestPermission();
  }, []);

  const handleScan = event => {
    const data = event?.nativeEvent?.codeStringValue;
    console.log('QR Data:', data);
    setScanResult(data);
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Camera permission required!</Text>
        <TouchableOpacity onPress={() => Linking.openSettings()}>
          <Text style={{ color: 'blue' }}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        cameraType="back"
        scanBarcode
        onReadCode={handleScan}
      />
      {scanResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Scanned: {scanResult}</Text>
        </View>
      )}
    </View>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultBox: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  resultText: { fontSize: 16, fontWeight: 'bold' },
});
