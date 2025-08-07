import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import BackButton from '../../components/BackButton';
import styles from '../../styles/globalStyles';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScaledSheet } from 'react-native-size-matters';


const ReferToCustomer = () => {
  const [storeId, setStoreId] = useState(" ");
  const [storeName, setStoreName] = useState(" ");
  const qrRef = useRef();
  const viewShotRef = useRef();

  const handleShare = async () => {
    try {
      // Capture QR code as image
      const uri = await viewShotRef.current.capture();

      // Share the captured image
      await Share.open({
        title: 'Share Store QR',
        message:
          '🛍️ Add my store to start shopping!\n\n' +
          '📲 Scan the QR code to add the store instantly.\n' +
          '🆔 Or enter Store ID: ' + storeId + ' manually in the app.\n\n' +
          'Let\'s start shopping today!',
        url: `file://${uri}`,
        type: 'image/png',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };


  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        if (role == "CUSTOMER") {
          const jsonValue = await AsyncStorage.getItem('@selected_store');
          console.log(jsonValue)
          if (jsonValue) {
            const parsedStore = JSON.parse(jsonValue);
            console.log(parsedStore.storeId,parsedStore.storeName)
            setStoreId(parsedStore.storeId);
            setStoreName(parsedStore.storeName)
          }
        }
        // if (selectedAddressId) {
        //   setStoreId(selectedAddressId);
        //   setStoreName("storeName")
        // } else {
        //   console.warn(' storeQrId not found inside parsed profile');
        // }
        else {
          const rawData = await AsyncStorage.getItem('storekeeperProfile');
          if (rawData) {
            const parsedData = JSON.parse(rawData);
            const storeQrId = parsedData.storeQrId;
            const storeName = parsedData.storeName;
            console.log('✅ storeQrId from AsyncStorage:', storeQrId, storeName);
            if (storeQrId) {
              setStoreId(storeQrId);
              setStoreName(storeName)
            } else {
              console.warn(' storeQrId not found inside parsed profile');
            }
          } else {
            console.warn('storekeeperProfile not found in AsyncStorage');
          }
        }

      } catch (error) {
        console.error('❌ Failed to fetch and parse store ID:', error);
      }
    };

    fetchStoreId();
  }, []);


  return (
    <View style={styles.pageContainer}>
      <BackButton title="Refer to Customer" />
      <View style={innerStyle.topContainer}>
        <TouchableOpacity
          style={innerStyle.shareIconContainer}
          onPress={handleShare}
        >
          <Entypo name="share" size={28} color={Colors.primary} />
          {/* <EvilIcons name="share-google" color="#000" size={24} /> */}
        </TouchableOpacity>
      </View>
      <View style={innerStyle.container}>
        <View style={innerStyle.qrSection}>
          <Text style={innerStyle.heading}>{storeName}</Text>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.9 }}
            style={innerStyle.imageContainer}
          >
            <QRCode
              value={storeId}
              size={200}
              color={Colors.black}
              backgroundColor={Colors.white}
              getRef={qrRef}
            />
          </ViewShot>
        </View>

        <View style={innerStyle.storeIdContainer}>
          <Text style={innerStyle.label}>Store ID:</Text>
          <Text style={innerStyle.id}>{storeId}</Text>
        </View>
      </View>
    </View>
  );
};

export default ReferToCustomer;

const { height: screenHeight } = Dimensions.get('window');

const innerStyle = ScaledSheet.create({
  topContainer: {
    paddingRight: '20@s',
  },
  container: {
    gap: '15@s',
    alignItems: 'center',
    padding: '20@s',
    backgroundColor: Colors.white,
    height: screenHeight * 0.75,
    marginTop: '16@vs',
  },
  shareIconContainer: {
    alignSelf: 'flex-end',
    marginTop: '10@vs',
  },
  imageContainer: {
    padding: '5@s',
    borderRadius: '2@s',
    elevation: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginVertical: '30@vs',
  },
  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: '30@vs',
  },
  qrSection: {
    alignItems: 'center',
  },
  storeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '500',
  },
  id: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: '4@s',
  },
});