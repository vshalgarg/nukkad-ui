import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import AddressCard from '../../components/AddressCard';
import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import CartItem from '../../components/CartItem';

import { useAddress } from '../../contexts/addressContext';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/authContext';
import { getCartItemsAPI } from '../../services/customer/cartService';
import { useDispatch, useSelector } from 'react-redux';

import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import { showToast } from '../../utils/toastUtils';
import { clearCart, setCartItems } from '../../store/cartSlice';
import { placeOrder } from '../../services/customer/orderService';
import { useStore } from '../../contexts/storeContext';

const ShoppingCart = () => {
  const { address, selectedAddressId, setMode, setAddressData } = useAddress();
  const { safeReplace, safePush } = useSafeRouter();
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { fromRepeatOrder } = route.params || {};

  const dispatch = useDispatch();
  console.log('selectedAddressId', selectedAddressId);

  const cartItems = useSelector(state => state.cart.items);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [orderInProgress, setOrderInProgress] = useState(false);
  const { storeData } = useStore();
  console.log('storeData', storeData);
  const storeKeeperId = storeData?.storekeeperId || storeData?.id;

  const selectedAddress =
    address.find(item => item.id.toString() === selectedAddressId) ||
    address.find(item => item.isDefault);
  console.log(selectedAddress);

  const fetchCartItems = async () => {
    try {
      const res = await getCartItemsAPI(token);
      console.log('res+data', res);
      const formattedItems = (res || []).map(item => ({
        cartItemId: item.id,
        selectedUnit: item.selectedUnit,
        quantity: item.quantity,
        product: {
          id: item.itemId,
          name: item.itemName,
          image: item.imageUrls?.[0] || '',
          amount: item.quantity,
          selectedUnit: item.selectedUnit,
          quantity: item.allUnits,
        },
      }));

      setCartItems(formattedItems);
      dispatch(setCartItems(formattedItems));
    } catch (err) {
      showToast('error', 'Failed to load cart items');
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const totalCount = cartItems.reduce((total, item) => {
    const isPacket = item.product.selectedUnit?.toLowerCase() === 'pkt';
    return total + (isPacket ? parseInt(item.product.amount) || 0 : 1);
  }, 0);

  const handleAddAddress = async () => {
    setMode('add');
    setAddressData(null);
    safePush('AddressForm');
  };

  const handleAddItems = () => {
    if (fromRepeatOrder) {
      safeReplace('CustomerDashboard');
    } else {
      navigation.goBack();
    }
  };

  const handleCompleteOrder = async () => {
    if (orderInProgress) return; // prevent double tap
    setOrderInProgress(true);

    if (!selectedAddress) {
      showToast('error', 'Add address before checkout');
      setOrderInProgress(false);
      return;
    }

    if (cartItems.length === 0) {
      showToast('error', 'Add items before checkout');
      setOrderInProgress(false);
      return;
    }

    const hasInvalidAmount = cartItems.some(item => {
      const amt = Number(item.product.amount);
      return isNaN(amt) || amt <= 0;
    });

    if (hasInvalidAmount) {
      alert('Some items have zero or invalid quantity. Please correct them.');
      setOrderInProgress(false);
      return;
    }

    const payload = {
      deliveryAddressId: selectedAddress?.id,
      storeKeeperId: storeKeeperId,
      orderItem: cartItems.map(item => ({
        itemId: item.product.id,
        quantity: Number(item.product.amount),
        unit: item.product.selectedUnit,
      })),
    };
    console.log('payload', payload);

    try {
      const res = await placeOrder(payload, token);
      console.log('✅ Order Placed:', res);


      // ✅ Navigate
      safePush('PlaceOrder');
    } catch (error) {
      console.error('❌ Error placing order:', error);
      showToast('error', error.message || 'Failed to place order');
    } finally {
      setOrderInProgress(false);
      dispatch(clearCart());
    }
  };

  const handleEditAddress = address => {
    setMode('edit');
    setAddressData(address);
    safePush('AddressForm');
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.pageContainer}>
        <BackButton title="Shopping Cart" />
        <View style={innerStyle.emptyContainer}>
          <Text style={{ fontSize: 30, fontWeight: '800', marginBottom: 20 }}>
            Your cart is empty 🛒
          </Text>
          <TouchableOpacity
            onPress={handleAddItems}
            style={innerStyle.browseBtn}
          >
            <Text style={innerStyle.browseBtnText}>Browse Grocery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, styles.pageContainer]}>
      <BackButton
        style={innerStyle.backButton}
        title={`Shopping Cart (${totalCount} ${
          totalCount > 1 ? 'items' : 'item'
        })`}
      />

      <FlatList
        data={cartItems}
        keyExtractor={item => item.product.id?.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        )}
        contentContainerStyle={{ padding: Fonts.sizes.base }}
        ListHeaderComponent={
          <>
            <Text style={innerStyle.heading}>Delivery Address</Text>
            {selectedAddress ? (
              <AddressCard
                item={selectedAddress}
                onEdit={handleEditAddress}
                isSelected={true}
                source="cart"
                onSelect={() =>
                  safePush({ name: 'Address', params: { fromCart: 'true' } })
                }
                showChangeAddress={true}
              />
            ) : (
              <Pressable onPress={handleAddAddress}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={Colors.secondary}
                />
                <Text style={innerStyle.buttonText}>Add Address</Text>
              </Pressable>
            )}

            <Text style={[innerStyle.heading, { marginTop: 20 }]}>
              Selected Items ({totalCount})
            </Text>
          </>
        }
        ListFooterComponent={
          <>
            <Pressable onPress={handleAddItems}>
              <Text style={innerStyle.addItems}>+ Add more Items</Text>
            </Pressable>
            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <CustomButton
                title={`Proceed`}
                onPress={handleCompleteOrder}
                disabled={!selectedAddress}
              />
            </View>
          </>
        }
      />
    </View>
  );
};

export default ShoppingCart;

const innerStyle = StyleSheet.create({
  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: '800',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
    marginLeft: 6,
  },
  addItems: {
    color: Colors.primary,
    textAlign: 'right',
    marginTop: 12,
    fontWeight: '500',
    fontSize: Fonts.sizes.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  browseBtnText: {
    color: Colors.bgClr,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
});
