import React, { useState, useRef, useEffect } from 'react';
import { Image, View, Text, Dimensions } from 'react-native';

import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import BackButton from '../../components/BackButton';
import styles from '../../styles/globalStyles';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScaledSheet } from 'react-native-size-matters';
import { showToast } from '../../utils/toastUtils';
import CustomButton from '../../components/CustomButton';
import StoreSelector from '../../components/StoreSelector';
import { getMyStores } from '../../services/customer/getAllStoreService';
import { useAuth } from '../../contexts/authContext';
import strings, { shareStrings } from '../../constants/string';

const ReferToCustomer = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef();
  const playStoreUrl = 'https://www.google.com';
  const { token } = useAuth();

  const isShareCancelled = err => {
    if (!err) return false;
    const msg = (err.message || err.error || '').toString().toLowerCase();
    const code = (err.code || '').toString().toLowerCase();
    return (
      msg.includes('user did not share') ||
      msg.includes('user canceled') ||
      msg.includes('user cancelled') ||
      msg.includes('cancelled') ||
      msg.includes('canceled') ||
      code === 'ecancelled' ||
      code.includes('cancel') ||
      err === 'USER_CANCELLED' ||
      err === 'CANCELED'
    );
  };

  const handleShare = async () => {
    if (!selectedStore) {
      showToast('error', 'No store selected', 'Please select a store to share');
      return;
    }

    try {
      const uri = await viewShotRef.current.capture();

      await Share.open({
        title: shareStrings.title(selectedStore.storeName),
        message: shareStrings.message(
          selectedStore.storeName,
          selectedStore.storeId,
          playStoreUrl,
        ),
        url: `file://${uri}`,
        type: 'image/png',
      });
    } catch (error) {
      if (isShareCancelled(error)) {
        console.log('Share cancelled by user — ignoring.');
        return;
      }
      console.error('Share error:', error);
      showToast(
        'error',
        'Failed to share',
        error.message || 'Please try again',
      );
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        setCurrentRole(role);
        let storesData = [];

        if (role == 'CUSTOMER') {
          const response = await getMyStores(token);
          console.log(response);
          storesData = response;
        } else {
          const rawData = await AsyncStorage.getItem('storekeeperProfile');
          if (rawData) {
            const parsedData = JSON.parse(rawData);
            if (parsedData.storeQrId) {
              storesData = [
                {
                  storeId: parsedData.storeQrId,
                  storeName: parsedData.storeName,
                  image: parsedData.image,
                },
              ];
            }
          }
        }

        setStores(storesData);

        if (storesData.length > 0) {
          const selectedStoreJson = await AsyncStorage.getItem(
            '@selected_store',
          );
          if (selectedStoreJson) {
            const currentStore = JSON.parse(selectedStoreJson);
            setSelectedStore(currentStore);
          } else {
            setSelectedStore(storesData[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
        showToast('error', 'Error', 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return (
      <View style={styles.pageContainer}>
        <BackButton title="Refer to Customer" />
        <View style={innerStyle.loadingContainer}>
          <Text>Loading stores...</Text>
        </View>
      </View>
    );
  }

  if (stores.length === 0) {
    return (
      <View style={styles.pageContainer}>
        <BackButton title="Refer to Customer" />
        <View style={innerStyle.emptyContainer}>
          <Text style={innerStyle.emptyText}>No stores available</Text>
          <Text style={innerStyle.emptySubtext}>
            {currentRole === 'CUSTOMER'
              ? 'Add stores to start sharing them'
              : 'Store information not available'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <BackButton title="Refer to Customer" />

      <View style={innerStyle.container}>
        {currentRole === 'CUSTOMER' ? (
          <View style={innerStyle.selectorContainer}>
            <Text style={innerStyle.selectorLabel}>
              {strings.selectStoreToShare}
            </Text>
            <StoreSelector
              stores={stores}
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
              placeholder="Choose a store"
            />
          </View>
        ) : (
          ''
        )}

        {selectedStore ? (
          <>
            <View style={innerStyle.qrSection}>
              <Text style={innerStyle.heading}>{selectedStore?.storeName}</Text>

              {selectedStore?.image && (
                <Image
                  source={{ uri: selectedStore.image }}
                  style={innerStyle.storeImage}
                  resizeMode="cover"
                />
              )}

              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 0.9 }}
                style={innerStyle.imageContainer}
              >
                <QRCode
                  value={String(selectedStore?.storeId || '')}
                  size={200}
                  color={Colors.secondary}
                  backgroundColor={Colors.white}
                />
              </ViewShot>

              <View style={innerStyle.storeIdContainer}>
                <Text style={innerStyle.label}>Store ID:</Text>
                <Text style={innerStyle.id}>
                  {selectedStore?.storeId ?? 'N/A'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={{ color: 'gray' }}>No store selected</Text>
        )}
      </View>

      <View style={innerStyle.ButtonContainer}>
        <CustomButton
          title={'Share'}
          onPress={handleShare}
          disabled={!selectedStore}
        />
      </View>
    </View>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const innerStyle = ScaledSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    gap: '20@s',
    alignItems: 'center',
    padding: '20@s',
    backgroundColor: Colors.white,
    minHeight: screenHeight * 0.7,
  },
  selectorContainer: {
    width: '100%',
    marginBottom: '20@vs',
  },
  selectorLabel: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    marginBottom: '8@vs',
    color: Colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  emptyText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: '8@vs',
  },
  emptySubtext: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  storeImage: {
    width: '80@s',
    height: '80@s',
    borderRadius: '40@s',
    marginBottom: '15@vs',
    borderWidth: 2,
    borderColor: Colors.borderColor,
  },
  imageContainer: {
    padding: '5@s',
    borderRadius: '2@s',
    elevation: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginVertical: '20@vs',
  },
  heading: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '15@vs',
    color: Colors.primary,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
  },

  storeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
    padding: '12@s',
    borderRadius: '8@s',
    width: '100%',
  },

  label: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '500',
    color: Colors.secondary,
  },
  id: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: '8@s',
  },
  ButtonContainer: {
    position: 'absolute',
    height: '70@vs',
    width: '100%',
    bottom: '0%',
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReferToCustomer;
