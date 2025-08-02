import React, { useState, memo, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';

import BackButton from '../../components/BackButton';
import ConnectPopup from '../../components/ConnectPopUp';
import CustomButton from '../../components/CustomButton';
import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';
import {
  updateOrderPrices,
  updateOrderStatus,
  updateOrderNote,
} from '../../store/storekeeperOrdersSlice';
import Fonts from '../../styles/font';
import { dispatchOrder } from '../../services/storekeeper/dispatchOrderService';
import { useAuth } from '../../contexts/authContext';
import { updateOrderStatusById } from '../../services/storekeeper/orderStatusService';
import { FlashList } from '@shopify/flash-list';

const OrderItem = memo(
  ({
    item,
    price,
    isEditable,
    onPriceChange,
    outOfStock,
    onToggleOutOfStock,
  }) => {
    const itemId = item.itemId || item.productId;
    const itemTitle = item.itemName || item.productName;
    const itemWeight = `${item.quantity} ${item.unit}`;

    return (
      <View style={[innerStyle.card]}>
        <Image source={{ uri: item.imageUrls[0] }} style={innerStyle.image} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={innerStyle.title}>{itemTitle}</Text>
          <Text style={innerStyle.text}>Weight: {itemWeight}</Text>
        </View>

        <View style={innerStyle.priceContainer}>
          {isEditable && (
            <View style={innerStyle.toggleWrapper}>
              {/* <Text style={innerStyle.text}>Out of Stock</Text> */}
              <TouchableWithoutFeedback
                onPress={() => onToggleOutOfStock(itemId)}
              >
                <View
                  style={[
                    innerStyle.toggle,
                    outOfStock ? innerStyle.toggleOn : innerStyle.toggleOff,
                  ]}
                >
                  {!outOfStock ? (
                    <>
                      <Text style={innerStyle.toggleText}>In Stock</Text>
                      <View style={innerStyle.circle} />
                    </>
                  ) : (
                    <>
                      <View style={innerStyle.circle} />
                      <Text style={innerStyle.toggleText}>Out of Stock</Text>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}
          {isEditable ? (
            <TextInput
              placeholder="Set Price"
              placeholderTextColor={Colors.secondaryText}
              style={innerStyle.input}
              keyboardType="numeric"
              value={price?.toString()}
              maxLength={4}
              editable={!outOfStock}
              onChangeText={value => onPriceChange(itemId, value)}
            />
          ) : (
            <TextInput
              style={[innerStyle.input, { color: Colors.secondary }]}
              placeholder="Set Price"
              value={`₹ ${price}`}
              editable={false}
            />
          )}
        </View>
      </View>
    );
  },
);

const ShowDetails = () => {
  const [storeKeeperNote, setStoreKeeperNote] = useState();

  const [showPopup, setShowPopup] = useState(false);

  const dotRef = React.useRef(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const { token } = useAuth();

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { orderId, items, fromTab = 'PENDING' } = route.params;
  const parsedItems = JSON.parse(items);

  const order = useSelector(state =>
    state.storekeeperOrders.orders.find(order => order.orderId === orderId),
  );
  console.log('order from showDetails', order);

  useEffect(() => {
    if (order?.storeKeeperNote) {
      setStoreKeeperNote(order.storeKeeperNote);
    }
  }, [order?.storeKeeperNote]);
  const isInProgress = order?.orderStatus === 'IN_PROGRESS';
  const isDispatched = order?.orderStatus === 'DISPATCHED';
  const isDelivered = order?.orderStatus === 'DELIVERED';
  const isRejected = order?.orderStatus === 'CANCELLED';
  const [outOfStockMap, setOutOfStockMap] = useState(
    parsedItems.reduce((acc, item) => {
      const itemId = item.itemId || item.id || item.productId;
      acc[itemId] = false;
      return acc;
    }, {}),
  );

  const [prices, setPrices] = useState(
    parsedItems.reduce((acc, item) => {
      const itemId = item.itemId || item.id || item.productId;
      const matchedItem = order?.items.find(
        ordItem =>
          ordItem.itemId === itemId ||
          ordItem.id === itemId ||
          ordItem.productId === itemId,
      );
      acc[itemId] = matchedItem?.price !== undefined ? matchedItem.price : '';
      return acc;
    }, {}),
  );

  const handleToggleOutOfStock = useCallback(
    itemId => {
      setOutOfStockMap(prev => {
        const isNowOut = !prev[itemId];

        setPrices(prices => ({
          ...prices,
          [itemId]: isNowOut ? '0' : '',
        }));

        return {
          ...prev,
          [itemId]: isNowOut,
        };
      });
    },
    [setOutOfStockMap, setPrices],
  );

  const handlePriceChange = useCallback(
    (id, value) => {
      const numericValue = value.replace(/[^0-9]/g, '');
      setPrices(prev => ({ ...prev, [id]: numericValue }));
    },
    [setPrices],
  );

  const handleReject = orderId => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            const payload = { orderStatus: 'CANCELLED' };

            await updateOrderStatusById(orderId, payload, token);

            dispatch(
              updateOrderStatus({
                orderId: orderId,
                newStatus: 'CANCELLED',
              }),
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDispatch = async () => {
    // Validate all items have prices (zero allowed, but not null/undefined/NaN)
    const invalidItems = parsedItems.filter(item => {
      const itemId = item.itemId || item.id || item.productId;
      const price = prices[itemId];
      return price === null || price === undefined || isNaN(parseFloat(price));
    });

    if (invalidItems.length > 0) {
      Alert.alert(
        'Missing Prices',
        'Please enter a valid price for all items before dispatching.',
      );
      return;
    }

    Alert.alert('Dispatch Order', 'Are you sure you want to dispatch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dispatch',
        onPress: async () => {
          try {
            if (!order) {
              Alert.alert('Error', 'Order not found.');
              return;
            }

            const orderItem = parsedItems.map(item => {
              const itemId = item.itemId || item.id || item.productId;
              return {
                itemId,
                price: parseFloat(prices[itemId]) || 0,
              };
            });

            const payload = {
              orderId,
              storeKeeperNote: storeKeeperNote,
              orderItem,
            };

            await dispatchOrder(payload, token);

            const updatedItemsWithPrices = parsedItems.map(item => {
              const itemId = item.itemId || item.id || item.productId;
              return {
                ...item,
                price: parseFloat(prices[itemId]) || 0,
              };
            });

            dispatch(
              updateOrderPrices({ orderId, items: updatedItemsWithPrices }),
            );
            dispatch(updateOrderStatus({ orderId, newStatus: 'DISPATCHED' }));

            if (storeKeeperNote) {
              dispatch(updateOrderNote({ orderId, storeKeeperNote }));
            }
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to dispatch order');
          }
        },
      },
    ]);
  };

  const handleDeliver = orderId => {
    Alert.alert(
      'Deliver Order',
      'Are you sure you want to deliver this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Deliver',
          onPress: () => {
            // Navigate immediately
            navigation.reset({
              index: 0,
              routes: [
                { name: 'StorekeeperDashboard', params: { tab: 'DELIVERED' } },
              ],
            });
            // Process in background
            setTimeout(async () => {
              try {
                const payload = { orderStatus: 'DELIVERED' };

                await updateOrderStatusById(orderId, payload, token);

                dispatch(
                  updateOrderStatus({
                    orderId: orderId,
                    newStatus: 'DELIVERED',
                  }),
                );

                // Optional: Toast or log (avoid Alert here)
                console.log('Order marked as delivered');
              } catch (error) {
                console.error('Error delivering order:', error);
                // You can show a toast or log instead of Alert to avoid modal conflict
              }
            }, 100); // small delay to ensure navigation is in motion
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderOrderItem = useCallback(
    ({ item }) => {
      const itemId = item.itemId || item.id || item.productId;
      return (
        <OrderItem
          item={item}
          price={prices[itemId]}
          isEditable={!isDelivered && !isDispatched && !isRejected}
          onPriceChange={handlePriceChange}
          outOfStock={outOfStockMap[itemId]}
          onToggleOutOfStock={handleToggleOutOfStock}
        />
      );
    },
    [
      prices,
      isDelivered,
      isDispatched,
      isRejected,
      outOfStockMap,
      handlePriceChange,
      handleToggleOutOfStock,
    ],
  );

  const allPricesZero = parsedItems.every(item => {
    const itemId = item.itemId || item.id || item.productId;
    const price = prices[itemId];
    return !price || parseFloat(price) === 0;
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.pageContainer, { flex: 1 }]}>
        <BackButton title="Order Details" />

        <FlashList
          data={parsedItems}
          keyExtractor={(item, index) =>
            item.id || item.itemId || item.productId || index.toString()
          }
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <Text style={innerStyle.heading}>Delivery Address</Text>
              <View style={innerStyle.AddressCard}>
                <View style={innerStyle.rowBetween}>
                  <Text style={innerStyle.addressCardDetails}>
                    {order.customerName}
                  </Text>
                  {(isInProgress || isDispatched) && (
                    <TouchableOpacity
                      ref={dotRef}
                      onPress={() => {
                        dotRef.current?.measure(
                          (fx, fy, width, height, px, py) => {
                            setPopupPosition({
                              x: px + width - 160,
                              y: py + height + 5,
                            });
                            setShowPopup(true);
                          },
                        );
                      }}
                    >
                      <Entypo
                        name="dots-three-vertical"
                        size={18}
                        color={Colors.secondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <View>
                  <Text style={innerStyle.addressCardDetails}>
                    {order.customerMobileNumber}
                  </Text>
                </View>
                <Text style={innerStyle.addressCardDetails}>
                  {order.address}
                </Text>
              </View>
              <Text style={innerStyle.heading}>Order ID: #{orderId}</Text>
            </View>
          }
          renderItem={renderOrderItem}
          ListFooterComponent={
            // isPending ||
            isInProgress ||
            ((isDispatched || isDelivered) && storeKeeperNote?.trim()) ? (
              <View style={{ marginTop: 10, marginHorizontal: 5 }}>
                <Text
                  style={{
                    marginBottom: 5,
                    fontWeight: 'bold',
                    fontSize: Fonts.sizes.base,
                  }}
                >
                  Note :
                </Text>

                {isInProgress ? (
                  <TextInput
                    style={{
                      height: 100,
                      borderWidth: 1,
                      borderColor: Colors.borderColor,
                      borderRadius: 10,
                      padding: 10,
                      textAlignVertical: 'top',
                      backgroundColor: Colors.white,
                    }}
                    multiline
                    placeholder="Write a note to the customer about this order"
                    value={storeKeeperNote}
                    editable
                    onChangeText={setStoreKeeperNote}
                  />
                ) : (
                  <Text
                    style={{
                      fontStyle: 'italic',
                      color: Colors.textColor,
                      fontSize: 15,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {` ${storeKeeperNote} `}
                  </Text>
                )}
              </View>
            ) : null
          }
        />

        {(isInProgress || isDispatched) && (
          <View style={innerStyle.fixedButtonWrapper}>
            <View style={innerStyle.buttonContainer}>
              {isInProgress && (
                <>
                  <CustomButton
                    title="Reject Order"
                    onPress={() => handleReject(orderId)}
                    style={{ backgroundColor: Colors.reject, borderWidth: 0 }}
                  />
                  <CustomButton
                    title="Dispatch Order"
                    onPress={handleDispatch}
                    disabled={allPricesZero}
                    style={{ fontSize: Fonts.sizes.sm }}
                  />
                </>
              )}
              {isDispatched && (
                <CustomButton
                  title="Deliver Order"
                  onPress={() => handleDeliver(orderId)}
                  style={{ backgroundColor: Colors.primary, borderWidth: 0 }}
                />
              )}
            </View>
          </View>
        )}

        <ConnectPopup
          visible={showPopup}
          onClose={() => setShowPopup(false)}
          phone={order?.customerMobileNumber || '9999999999'}
          position={popupPosition}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ShowDetails;

const innerStyle = StyleSheet.create({
  AddressCard: {
    padding: 8,
    borderWidth: 2,
    borderRadius: 15,
    borderColor: Colors.primary,
    marginBottom: 15,
  },
  addressCardDetails: {
    lineHeight: 30,
    fontSize: Fonts.sizes.base,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    height: 100,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  title: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 5,
    color: Colors.secondary,
  },
  priceContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: '5',
  },
  toggle: {
    width: 80,
    height: 34,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    overflow: 'hidden',
    gap: 5,
  },

  toggleText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.white,
  },

  toggleOn: {
    backgroundColor: Colors.reject,
  },

  toggleOff: {
    backgroundColor: Colors.primary,
  },

  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },

  input: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 50,
    paddingHorizontal: 10,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rejectedText: {
    color: Colors.reject,
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
    width: 80,
    textAlign: 'center',
  },

  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
});
