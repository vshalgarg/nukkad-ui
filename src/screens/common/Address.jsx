import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  Alert,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddressCard from '../../components/AddressCard';
import BackButton from '../../components/BackButton';
import { useAddress } from '../../contexts/addressContext';
import styles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';

const Address = () => {
  const {
    setMode,
    setAddressData,
    address,
    selectedAddressId,
    setSelectedAddressId,
    deleteAddress,
    markAsDefault,
  } = useAddress();

  const navigation = useNavigation();
  const route = useRoute();
  const initialFromCart = route.params?.fromCart === 'true';
  const [fromCart] = useState(initialFromCart);
  const hideDelete = fromCart;

  const handleSelectAddress = async id => {
    console.log('🛒 Address card pressed!');
    setSelectedAddressId(String(id));
    await AsyncStorage.setItem('selectedAddressId', String(id));
    if (fromCart) {
      navigation.goBack();
    }
  };

  const handleAddAddress = () => {
    setMode('add');
    setAddressData(null);
    navigation.navigate('AddressForm');
  };

  const handleEditAddress = address => {
    setMode('edit');
    setAddressData(address);
    navigation.navigate('AddressForm');
  };

  const handleDeleteAddress = item => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const isDeletingDefault = item.id === selectedAddressId;

            deleteAddress(item.id);

            const remainingAddresses = address.filter(a => a.id !== item.id);
            if (isDeletingDefault && remainingAddresses.length > 0) {
              const fallback = remainingAddresses[0];
              await handleSelectAddress(fallback.id);
            } else if (remainingAddresses.length === 0) {
              setSelectedAddressId(null);
              await AsyncStorage.removeItem('selectedAddressId');
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      const syncSelectedAddress = async () => {
        try {
          const storedSelectedId = await AsyncStorage.getItem(
            'selectedAddressId',
          );

          if (
            storedSelectedId &&
            address.some(a => String(a.id) === storedSelectedId)
          ) {
            setSelectedAddressId(storedSelectedId);
          } else {
            const defaultAddr = address.find(a => a.isDefault);
            const fallback = defaultAddr || address[0];

            if (fallback) {
              setSelectedAddressId(String(fallback.id));
              await AsyncStorage.setItem(
                'selectedAddressId',
                String(fallback.id),
              );
            } else {
              setSelectedAddressId(null);
              await AsyncStorage.removeItem('selectedAddressId');
            }
          }

          if (route.params?.fromCart) {
            navigation.setParams({ fromCart: undefined });
          }
        } catch (err) {
          console.warn('⚠️ Failed to load selected address:', err.message);
        }
      };

      syncSelectedAddress();
    }, [address]),
  );

  const handleMarkAsDefault = async item => {
    try {
      await handleSelectAddress(item.id);
      await markAsDefault(item.id);
    } catch (error) {
      console.error('Error marking address as default:', error);
    }
  };

  return (
    <View style={[styles.pageContainer]}>
      <BackButton title="Delivery Address" />
      <View style={innerStyle.container}>
        <FlatList
          data={[...address]}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <AddressCard
              item={item}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSelect={() => handleSelectAddress(item.id)}
              onMarkDefault={() => handleMarkAsDefault(item)}
              isSelected={String(item.id) === String(selectedAddressId)}
              hideDelete={hideDelete || address.length === 1}
              source={fromCart ? 'cart' : 'sidebar'}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100, // ← was 20, increase this!
            flexGrow: 1,
            justifyContent: address.length === 0 ? 'center' : 'flex-start',
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={innerStyle.emptyContainer}>
              <Text style={innerStyle.emptyText}>No address added</Text>
              <Pressable
                style={innerStyle.addButton}
                onPress={handleAddAddress}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={Colors.bgClr}
                />
                <Text style={innerStyle.addButtonText}>Add Address</Text>
              </Pressable>
            </View>
          )}
        />

        {address.length > 0 && (
          <View style={innerStyle.btnContainer}>
            <Pressable style={innerStyle.addButton} onPress={handleAddAddress}>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={Colors.bgClr}
              />
              <Text style={innerStyle.addButtonText}>Add Address</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const innerStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    position:"relative"
  },
  btnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondaryText,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
  },
  addButtonText: {
    color: Colors.bgClr,
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default Address;
