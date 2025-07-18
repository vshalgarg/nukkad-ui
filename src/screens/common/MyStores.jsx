import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
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
import { getMyStores, deleteStore} from "../../services/customer/getAllStoreService";
import { useAuth } from '../../contexts/authContext'; 

export default function MyStores() {
  const { safePush } = useSafeRouter();
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(null);
  const { saveStore ,storeData} = useStore();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await getMyStores(token);
      console.log('📦 Stores fetched in component:', response);
      setStores(response);

      if (response.length === 1) {
        // Auto-select if only one store exists
        saveStore(response[0]);
      } else {
        // If current default store is deleted or not set
        const storeExists =
          storeData &&
          response.some(
            store => store.storekeeperId === storeData.storekeeperId,
          );

        if (!storeExists) {
          // Auto-set the first store as default
          saveStore(response[0]);
        }
      }
      

      if (response.length > 0) setSelectedStoreIndex(0);
    } catch (err) {
      console.error('❌ Failed to fetch stores in component:', err);
    } finally {
      setLoading(false);
    }
  };
  
  

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAddStore = () => {
    safePush('AddStore');
  };


  const handleDelete = store => {
    console.log('🗑️ Delete pressed for:', store);

    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${store.storeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const idToDelete = store.id || store.storekeeperId;
              console.log('✅ Confirmed delete of:', idToDelete);

              // ✅ Clear from context BEFORE delete
              if (storeData?.storekeeperId === store.storekeeperId) {
                console.log('🧹 Removing deleted store from context...');
                saveStore(null); // This clears the store from global context
              }

              await deleteStore(idToDelete, token);
              await fetchStores(); // Re-fetch updated store list
            } catch (err) {
              console.error(
                '❌ Delete failed:',
                err?.response?.data || err.message,
              );
            }
          },
        },
      ],
    );
  };
  

  const renderItem = ({ item }) => {
    const isSelected = storeData?.id === item.id;

    const handleSetDefault = () => {
      saveStore(item);
    };

    return (
      <Pressable
        style={[innerStyle.card, isSelected && innerStyle.selectedCard]}
      >
        <View style={innerStyle.radioContainer}>
          <View style={innerStyle.dataColumn}>
            <Text style={innerStyle.shopName}>{item.storeName}</Text>
            <Text
              style={innerStyle.address}
            >{`${item.addressLine1}, ${item.city}`}</Text>
          </View>

          <View style={innerStyle.iconColumn}>
            <Pressable onPress={() => handleDelete(item)}>
              <MaterialIcons
                name="delete-outline"
                size={24}
                color={Colors.secondary}
              />
            </Pressable>
            {!isSelected && (
              <Pressable
                style={innerStyle.setDefaultBtn}
                onPress={handleSetDefault}
              >
                <Text style={innerStyle.setDefaultText}>Set as Default</Text>
              </Pressable>
            )}
            {isSelected && (
              <Text style={innerStyle.defaultBadge}>Default Store</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };
  

  return (
    <View style={styles.pageContainer}>
      <BackButton title="My Stores" />
      <View style={innerStyle.container}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : stores.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={innerStyle.noStores}>No stores found</Text>
            <View style={innerStyle.addStoreContainer}>
              <Pressable style={innerStyle.button} onPress={handleAddStore}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={Colors.secondary}
                />
                <Text style={innerStyle.buttonText}> Add store</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <FlatList
              data={stores}
              keyExtractor={(item, index) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            <View style={innerStyle.btnContainer}>
              <CustomButton
                onPress={handleAddStore}
                title="Add Store"
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

const innerStyle = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: Colors.bgClr,
  },
  noStores: {
    fontSize: Fonts.sizes.lg,
    color: Colors.secondaryText,
    marginTop: 20,
    textAlign: 'center',
  },
  setDefaultBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setDefaultText: {
    color: Colors.bgClr,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  defaultBadge: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },

  addStoreContainer: {
    alignItems: 'center',
    padding: 5,
    marginVertical: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 8,
    paddingHorizontal: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
    marginLeft: 5,
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.bgClr,
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
  },
  dataColumn: {
    height: '100%',
    justifyContent: 'space-around',
  },
  iconColumn: {
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  shopName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  address: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});
