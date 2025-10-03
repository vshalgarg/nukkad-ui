import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
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
import strings from '../../constants/string';

const ShoppingCart = () => {
  const { address, selectedAddressId, setMode, setAddressData } = useAddress();
  const { safeReplace, safePush } = useSafeRouter();
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { fromRepeatOrder } = route.params || {};

  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [loading, setLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [orderInProgress, setOrderInProgress] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const { storeData } = useStore();
  const storeKeeperId = storeData?.storekeeperId || storeData?.id;

  const selectedAddress =
    address.find(item => item.id.toString() === String(selectedAddressId)) ||
    address.find(item => item.isDefault);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCartItemsAPI(token);
      const formattedItems = (res || []).map(item => ({
        cartItemId: item.id,
        product: {
          id: item.itemId,
          name: item.itemName,
          image: item.imageUrls?.[0] || '',
          amount: item.quantity,
          selectedUnit: item.selectedUnit,
          quantity: item.allUnits,
        },
      }));
      dispatch(setCartItems(formattedItems));
    } catch (err) {
      showToast('error', strings.failedToLoadItems);
    } finally {
      setLoading(false);
    }
  }, [dispatch, token]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  useFocusEffect(
    useCallback(() => {
      if (!fromRepeatOrder) fetchCartItems();
    }, [fetchCartItems, fromRepeatOrder]),
  );

  const totalItemsInCart = cartItems?.length;

  const handleAddItems = () => {
    if (fromRepeatOrder) {
      safeReplace('CustomerDashboard');
    } else {
      navigation.goBack();
    }
  };

  const handleAddAddress = () => {
    setMode('add');
    setAddressData(null);
    safePush('AddressForm');
  };

  const handleEditAddress = address => {
    setMode('edit');
    setAddressData(address);
    safePush('AddressForm');
  };

  const handleCompleteOrder = async () => {
    if (orderInProgress) return;
    setOrderInProgress(true);

    if (!selectedAddress) {
      showToast('error', strings.missingAddress1, strings.missingAddress2);
      setOrderInProgress(false);
      return;
    }
    if (!storeKeeperId) {
      showToast('error', strings.missingStore1, strings.missingStore2);
      setOrderInProgress(false);
      return;
    }
    if (cartItems.length === 0) {
      showToast('error', strings.missingItems1, strings.missingItems2);
      setOrderInProgress(false);
      return;
    }
    if (
      cartItems.some(
        item =>
          isNaN(Number(item.product.amount)) ||
          Number(item.product.amount) <= 0,
      )
    ) {
      showToast('error', strings.failedToPlaceOrder, strings.invalidQty);
      setOrderInProgress(false);
      return;
    }

    const payload = {
      deliveryAddressId: selectedAddress?.id,
      storeKeeperId,
      orderItem: cartItems.map(item => ({
        itemId: item.product.id,
        quantity: Number(item.product.amount),
        unit: item.product.selectedUnit,
      })),
    };

    safePush('PlaceOrder');

    try {
      await placeOrder(payload, token);
      dispatch(clearCart());
    } catch (error) {
      showToast('error', error.message || 'Failed to place order');
    } finally {
      setOrderInProgress(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.pageContainer,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.pageContainer}>
        <BackButton title={strings.shoppingCart} />
        <View style={innerStyle.emptyContainer}>
          <Text style={{ fontSize: 30, fontWeight: '800', marginBottom: 20 }}>
            {strings.emptyCart}
          </Text>
          <TouchableOpacity
            onPress={handleAddItems}
            style={innerStyle.browseBtn}
          >
            <Text style={innerStyle.browseBtnText}>
              {strings.browseGrocery}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[{ flex: 1 }, styles.pageContainer]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <BackButton
        style={innerStyle.backButton}
        title={strings.cartTitle(totalItemsInCart)}
      />
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) =>
          item?.product?.id ? item.product.id.toString() : `fallback-${index}`
        }
        renderItem={({ item }) => (
          <CartItem
            item={item}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            inputAccessoryViewID="qty"
          />
        )}
        contentContainerStyle={{
          padding: Fonts.sizes.base,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={innerStyle.heading}>{strings.deliveryAddress}</Text>
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
              <Pressable
                onPress={handleAddAddress}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.lightBackground,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                    marginVertical: 12,

                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,

                    // Android shadow (mimic iOS)
                    // elevation: 1,
                    transform: pressed ? [{ scale: 0.98 }] : [],
                  },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={Colors.primary}
                />
                <Text
                  style={[
                    innerStyle.buttonText,
                    { fontSize: Fonts.sizes.base, color: Colors.secondary },
                  ]}
                >
                  {strings.addAddress}
                </Text>
              </Pressable>
            )}

            <Text style={[innerStyle.heading, { marginTop: 20 }]}>
              {strings.selectedItems} ({totalItemsInCart})
            </Text>
          </>
        }
      />

      {!keyboardVisible && (
        <View style={innerStyle.fixedBottomContainer}>
          <CustomButton title={strings.addMoreItems} onPress={handleAddItems} />
          <CustomButton
            title={strings.proceed}
            onPress={handleCompleteOrder}
            disabled={!selectedAddress || orderInProgress}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ShoppingCart;

const innerStyle = StyleSheet.create({
  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: '700',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
    marginLeft: 6,
  },
  addItemsButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderColor: Colors.primary,
    borderWidth: 1,
    marginRight: 10,
  },
  addItemsButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.white,
    padding: '10',
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
    color: Colors.white,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
  backButton: {
    marginBottom: 10,
  },
});
