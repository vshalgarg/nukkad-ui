import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import { useStore } from '../../contexts/storeContext';
import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import Fonts from '../../styles/font';

import { useDialog } from '../../contexts/DialogContext';
import {
  getMyStores,
} from '../../services/customer/getAllStoreService';

import { useAuth } from '../../contexts/authContext';
import { useNavigation } from '@react-navigation/native';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultStore } from '../../services/customer/addStoreService';
import { showToast } from '../../utils/toastUtils';

export default function MyStores() {
  const { safePush } = useSafeRouter();
  const { token } = useAuth();
  const { saveStore, storeData, removeStore, allStores, setStoresList } =
    useStore();
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [selectedStoreTemp, setSelectedStoreTemp] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showDialog } = useDialog();
  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await getMyStores(token);
      setStores(response);
      let defaultStore = null;
      try {
        defaultStore = await getDefaultStore();
      } catch (e) {
        console.log('No default store set yet');
      }

      console.log(defaultStore);
      if (defaultStore) {
        setSelectedStoreTemp(defaultStore);
        saveStore(defaultStore);
        return;
      }

      if (response.length === 1) {
        saveStore(response[0]);
        setSelectedStoreTemp(response[0]);
        return;
      }

      if (storeData) {
        setSelectedStoreTemp(storeData);
        return;
      }

      const exists = await AsyncStorage.getItem('@selected_store');
      if (exists) {
        setSelectedStoreTemp(JSON.parse(exists));
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);
  useEffect(() => {
    if (storeData) {
      setSelectedStoreTemp(storeData);
    }
  }, [storeData]);

  console.log('selectedStoreTemp', selectedStoreTemp);
  const handleAddStore = () => {
    safePush('AddStore');
  };

  const handleDelete = store => {
    const idToDelete = store.id?.toString() || store.storekeeperId?.toString();

    showDialog({
      title: 'Delete Store',
      message: `Are you sure you want to delete "${store.storeName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await removeStore(idToDelete, token);

          setStores(prev =>
            prev.filter(
              s =>
                (s.id?.toString() || s.storekeeperId?.toString()) !==
                idToDelete,
            ),
          );

          if (
            selectedStoreTemp?.storekeeperId === store.storekeeperId &&
            stores.length === 1
          ) {
            setSelectedStoreTemp(null);
            saveStore(null);
          }

          console.log(` Store "${store.storeName}" deleted successfully.`);
        } catch (err) {
          console.error(
            ' Delete failed:',
            err?.response?.data || err.message,
          );
          showToast('error', 'Cannot Delete Default Store');
        }
      },
      onCancel: () => {
        console.log(' Delete canceled for store:', store.storeName);
      },
    });
  };

  const handleChangeStore = async () => {
    if (selectedStoreTemp) {
      await saveStore(selectedStoreTemp); 
    }
    navigation.goBack();
  };

  const handleSelectStoreTemp = store => {
    setSelectedStoreTemp(store);
  };

  const renderItem = ({ item }) => {
    const selectedId = String(
      selectedStoreTemp?.storekeeperId ||
        selectedStoreTemp?.id ||
        selectedStoreTemp.storeId,
    );
    const itemId = String(item.storekeeperId || item.id);
    const isSelected = selectedId === itemId;

    return (
      <Pressable
        style={[innerStyle.card, isSelected && innerStyle.selectedCard]}
        onPress={() => handleSelectStoreTemp(item)}
      >
        <View style={innerStyle.radioContainer}>
          <View style={innerStyle.dataColumn}>
            <Text
              style={innerStyle.shopName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.storeName}
            </Text>

            <Text
              style={innerStyle.address}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {[
                item.addressLine1,
                item.addressLine2,
                item.landmark,
                item.city,
                item?.country,
                item?.pincode,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          {!isSelected && (
            <View style={innerStyle.iconColumn}>
              <Pressable onPress={() => handleDelete(item)}>
                <MaterialIcons
                  name="delete-outline"
                  size={24}
                  color={Colors.secondary}
                />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.pageContainer}>
      <BackButton title={strings.myStores} />
      <View style={innerStyle.container}>
        {loading ? (
          <View style={innerStyle.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : stores.length === 0 ? (
          <View style={innerStyle.noStoresContainer}>
            <Ionicons
              name="storefront-outline"
              size={80}
              color={Colors.secondaryText}
            />

            <Text style={innerStyle.noStoresTitle}>
              {strings.noStoresFound}
            </Text>
            <Text style={innerStyle.noStoresSubTitle}>
              You don't have any stores yet. Start by adding your first store!
            </Text>
            <Pressable
              style={innerStyle.addStoreButton}
              onPress={handleAddStore}
            >
              <Ionicons name="add-circle" size={28} color={Colors.white} />
              <Text style={innerStyle.addStoreButtonText}>
                {strings.addStore}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              data={stores}
              extraData={selectedStoreTemp}
              keyExtractor={item =>
                item.id?.toString() || item.storekeeperId?.toString()
              }
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />

            <View style={innerStyle.btnContainer}>
              <CustomButton
                onPress={handleAddStore}
                title={strings.addStore}
                className="bg-white"
                textClassName="text-black"
              />
              <CustomButton
                onPress={handleChangeStore}
                title={strings.selectStore}
                className="bg-white"
                textClassName="text-black"
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const innerStyle = ScaledSheet.create({
  container: {
    flex: 1,
    padding: '15@s',
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStores: {
    fontSize: Fonts.sizes.lg,
    color: Colors.secondaryText,
    marginTop: '20@vs',
    textAlign: 'center',
  },
  addStoreContainer: {
    alignItems: 'center',
    padding: '5@s',
    marginVertical: '20@vs',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: '8@s',
    paddingHorizontal: '15@s',
    borderRadius: '50@s',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
    marginLeft: '5@s',
    color: 'white',
  },
  noStoresContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    backgroundColor: Colors.white,
  },

  noStoresTitle: {
    fontSize: Fonts.sizes.xl,
    color: Colors.secondary,
    fontWeight: 'bold',
    marginTop: '15@vs',
    textAlign: 'center',
  },

  noStoresSubTitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.secondaryText,
    marginTop: '8@vs',
    marginBottom: '25@vs',
    textAlign: 'center',
    lineHeight: 22,
  },

  addStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: '8@vs',
    paddingHorizontal: '20@s',
    borderRadius: '30@s',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  addStoreButtonText: {
    fontSize: Fonts.sizes.base,
    color: Colors.white,
    marginLeft: '10@s',
    fontWeight: '600',
  },

  card: {
    marginTop: '16@vs',
    padding: '16@s',
    borderRadius: '12@s',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: Colors.primary,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  dataColumn: {
    flex: 1,
    marginRight: '10@s',
  },

  iconColumn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  shopName: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: '4@vs',
    flexShrink: 1,
  },

  address: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
    flexShrink: 1,
  },

  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
