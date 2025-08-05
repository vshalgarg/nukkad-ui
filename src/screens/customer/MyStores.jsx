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
import {
  getMyStores,
  deleteStore,
} from '../../services/customer/getAllStoreService';
import { useAuth } from '../../contexts/authContext';
import { useNavigation } from '@react-navigation/native';
import strings from '../../constants/string';

export default function MyStores() {
  const { safePush } = useSafeRouter();
  const { token } = useAuth();
  const { saveStore, storeData } = useStore();
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [selectedStoreTemp, setSelectedStoreTemp] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await getMyStores(token);
      setStores(response);

      if (response.length === 1) {
        saveStore(response[0]);
        setSelectedStoreTemp(response[0]);
      } else {
        const exists =
          storeData &&
          response.some(s => s.storekeeperId === storeData.storekeeperId);

        if (exists) {
          setSelectedStoreTemp(storeData); // ✅ set selected store
        } else {
          saveStore(response[0]);
          setSelectedStoreTemp(response[0]); // ✅ fallback selection
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch stores:', err);
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
              const idToDelete =
                store.id?.toString() || store.storekeeperId?.toString();

              await deleteStore(idToDelete, token);

              // ✅ Use same logic as keyExtractor for filtering
              setStores(prev =>
                prev.filter(
                  s =>
                    (s.id?.toString() || s.storekeeperId?.toString()) !==
                    idToDelete,
                ),
              );

              if (selectedStoreTemp?.storekeeperId === store.storekeeperId) {
                setSelectedStoreTemp(null);
              }
              if (storeData?.storekeeperId === store.storekeeperId) {
                saveStore(null);
              }
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

  const handleChangeStore = () => {
    if (selectedStoreTemp) {
      saveStore(selectedStoreTemp);
    }
    navigation.goBack();
  };

  const handleSelectStoreTemp = store => {
    setSelectedStoreTemp(store);
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedStoreTemp?.id === item.id;

    return (
      <Pressable
        style={[innerStyle.card, isSelected && innerStyle.selectedCard]}
        onPress={() => handleSelectStoreTemp(item)}
      >
        <View style={innerStyle.radioContainer}>
          <View style={innerStyle.dataColumn}>
            <Text style={innerStyle.shopName}>{item.storeName}</Text>
            <Text style={innerStyle.address}>
              {`${item.addressLine1}, ${item.city}`}
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
      <BackButton title={strings.myStores}/>
      <View style={innerStyle.container}>
        {loading ? (
          <View style={innerStyle.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : stores.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={innerStyle.noStores}>{strings.noStoresFound}</Text>
            <View style={innerStyle.addStoreContainer}>
              <Pressable style={innerStyle.button} onPress={handleAddStore}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={Colors.secondary}
                />
                <Text style={innerStyle.buttonText}> {strings.addStore} </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <FlatList
              data={stores}
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
                title={strings.changeStore}
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
    marginTop: 20,
    textAlign: 'center',
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
    color: 'white',
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
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
