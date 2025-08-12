import React, { useState, memo, useEffect } from 'react';
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
  ScrollView,
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
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import { showToast } from '../../utils/toastUtils';

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

  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const { orderId, items, fromTab = 'PENDING' } = route.params;
  const parsedItems = JSON.parse(items);

  const order = useSelector(state =>
    state.storekeeperOrders.orders.find(order => order.orderId === orderId),
  );

  useEffect(() => {
    if (order?.storeKeeperNote) {
      setStoreKeeperNote(order.storeKeeperNote);
      console.log('in useEffect', order);
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

  const handleToggleOutOfStock = itemId => {
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
  };

  const handlePriceChange = (id, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPrices(prev => ({ ...prev, [id]: numericValue }));
  };

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
            try {
              const payload = { orderStatus: 'CANCELLED' };
              await updateOrderStatusById(orderId, payload, token);
              // navigation.navigate('StorekeeperDashboard', { tab: fromTab, forceRefresh: Date.now() });
              dispatch(
                updateOrderStatus({
                  orderId: orderId,
                  newStatus: 'CANCELLED',
                }),
              );
              //   navigation.navigate({
              //   name: 'StorekeeperDashboard',
              //   params: { forceRefresh: Date.now(), tab: fromTab },
              //   merge: true,
              // });

              navigation.goBack();
            } catch (error) {
              console.log(error);
              showToast(
                'error',
                'Failed to reject order',
                err?.message || 'Please try again',
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDispatch = async () => {
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
          onPress: async () => {
            try {
              const payload = { orderStatus: 'DELIVERED' };
              await updateOrderStatusById(orderId, payload, token);
              // navigation.navigate('StorekeeperDashboard', { tab: fromTab, forceRefresh: Date.now() });
              dispatch(
                updateOrderStatus({
                  orderId: orderId,
                  newStatus: 'DELIVERED',
                }),
              );
              navigation.goBack();

              console.log('Order marked as delivered');
            } catch (error) {
              console.error('Error delivering order:', error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const allPricesZero = parsedItems.every(item => {
    const itemId = item.itemId || item.id || item.productId;
    const price = prices[itemId];
    return !price || parseFloat(price) === 0;
  });

  return (
    <View style={[styles.pageContainer, { flex: 1 }]}>
      <BackButton title="Order Details" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={{ padding: 20 }}>
                <Text style={innerStyle.heading}>Delivery Address</Text>
                <View style={innerStyle.AddressCard}>
                  <View style={innerStyle.rowBetween}>
                    <Text style={innerStyle.addressCardDetails}>
                      {`${strings.customer}`}
                      {order?.address?.name}
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
                      {`${strings.mobile}:`} {order?.address?.mobileNumber}
                    </Text>
                  </View>
                  <Text style={innerStyle.addressCardDetails}>
                    {strings.address}
                    {order?.address?.addressLine1},{order?.address?.landmark}
                  </Text>
                </View>
                <Text style={innerStyle.heading}>Order ID: #{orderId}</Text>
              </View>
              {parsedItems.map(item => {
                const itemId = item.itemId || item.id || item.productId;
                return (
                  <OrderItem
                    key={itemId}
                    item={item}
                    price={prices[itemId]}
                    isEditable={!isDelivered && !isDispatched && !isRejected}
                    onPriceChange={handlePriceChange}
                    outOfStock={outOfStockMap[itemId]}
                    onToggleOutOfStock={handleToggleOutOfStock}
                  />
                );
              })}

              {(isInProgress ||
                ((isDispatched || isDelivered) && storeKeeperNote?.trim())) && (
                <View style={{ marginTop: 10, marginHorizontal: 25 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      fontSize: Fonts.sizes.base,
                    }}
                  >
                    Note :
                  </Text>

                  {isInProgress ? (
                    <TextInput
                      style={innerStyle.noteInput}
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
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {(isInProgress || isDispatched) && !isKeyboardVisible && (
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
        phone={order?.address?.mobileNumber || '9999999999'}
        position={popupPosition}
      />
    </View>
  );
};

export default ShowDetails;

const innerStyle = ScaledSheet.create({
  AddressCard: {
    padding: '5@s',
    borderWidth: 2,
    borderRadius: '15@s',
    borderColor: Colors.primary,
    marginBottom: '5@vs',
  },
  addressCardDetails: {
    lineHeight: '30@vs',
    fontSize: Fonts.sizes.sm, // already responsive from Fonts
    fontWeight: Fonts.weights.bold,
  },
  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    marginBottom: '10@vs',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: '10@s',
    borderRadius: '10@s',
    marginBottom: '10@vs',
    elevation: 2,
    height: 100,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fixedButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingVertical: '10@vs',
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },

  image: {
    width: '80@s',
    height: '100%',
    borderRadius: '10@s',
    resizeMode: 'cover',
  },
  title: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  text: {
    marginTop: '5@vs',
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
    gap: '3@s',
    marginBottom: '5@vs',
  },
  toggle: {
    width: '70@s',
    height: '30@vs',
    borderRadius: '20@s',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '8@s',
    overflow: 'hidden',
    gap: '5@s',
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
    width: '16@s',
    height: '16@s',
    borderRadius: '8@s',
    backgroundColor: Colors.white,
  },

  input: {
    width: '70@s',
    height: '30@vs',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 40,
    paddingHorizontal: 10,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rejectedText: {
    color: Colors.reject,
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
    width: '80@s',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: '20@s',
    paddingVertical: '5@vs',
    gap: '10@s',
  },
  orderDetails: {
    color: Colors.secondary,
    fontWeight: '500',
  },
});
