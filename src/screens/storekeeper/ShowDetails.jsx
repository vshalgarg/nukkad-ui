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
  InputAccessoryView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
import { useDialog } from '../../contexts/DialogContext';

const OrderItem = memo(
  ({
    item,
    price,
    isEditable,
    onPriceChange,
    outOfStock,
    hasError,
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
            !outOfStock && (
              <TextInput
                placeholder="Price"
                placeholderTextColor={Colors.secondaryText}
                style={[
                  innerStyle.input,
                  hasError && innerStyle.inputError, // this applies red border if error exists
                ]}
                keyboardType="number-pad"
                inputAccessoryViewID="doneKeyboardAccessory"
                value={price ? price.toString() : ''}
                maxLength={4}
                onChangeText={value => onPriceChange(itemId, value)}
              />
            )
          ) : (
            <TextInput
              style={[
                innerStyle.input,
                price === null
                  ? { fontSize: Fonts.sizes.xxs } // out of stock styling
                  : {
                      color: Colors.secondary,
                      borderColor: Colors.borderColor,
                    }, // normal styling
              ]}
              placeholder="Price"
              value={price === null ? 'Out of Stock' : `${price}`}
              editable={false}
            />
          )}
        </View>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="doneKeyboardAccessory">
            <View style={innerStyle.accessoryContainer}>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={innerStyle.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </View>
    );
  },
);

const ShowDetails = () => {
  const [storeKeeperNote, setStoreKeeperNote] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const dotRef = React.useRef(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const { token } = useAuth();

  const [priceErrors, setPriceErrors] = useState({});

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showDialog } = useDialog();

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
  console.log('order details', order);

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

  const showMyDialog = () => {
    showDialog({
      title: 'Dispatch',
      message: 'Are you sure,you want to dispatch?',
      onConfirm: handleConfirm,
    });
  };

  const handleToggleOutOfStock = itemId => {
    setOutOfStockMap(prev => {
      const isNowOut = !prev[itemId];
      Keyboard.dismiss();

      setPrices(prices => ({
        ...prices,
        [itemId]: isNowOut ? null : '',
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

    setPriceErrors(prevErrors => ({
      ...prevErrors,
      [id]: !numericValue, // true = error if empty
    }));
  };

  const handleReject = orderId => {
    showDialog({
      title: 'Reject Order',
      message: 'Are you sure you want to reject this order?',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Delivery cancelled');
      },

      onConfirm: async () => {
        try {
          const payload = { orderStatus: 'CANCELLED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(
            updateOrderStatus({
              orderId: orderId,
              newStatus: 'CANCELLED',
            }),
          );
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
    });
  };

  const handleDispatch = async () => {
    const newErrors = {};

    parsedItems.forEach(item => {
      const itemId = item.itemId || item.id || item.productId;
      const price = prices[itemId];
      const isOutOfStock = outOfStockMap[itemId];

      if (!isOutOfStock && (!price || isNaN(parseFloat(price)))) {
        newErrors[itemId] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setPriceErrors(newErrors);

      showDialog({
        title: 'Missing Prices',
        message: 'Please enter a valid price for all items before dispatching.',
        cancelText: 'OK',
        onCancel: () => {
          console.log('Validation error');
        },
      });

      return;
    }

    showDialog({
      title: 'Dispatch Order',
      message: (
        <View style={{ paddingVertical: 5 }}>
          <View style={innerStyle.row}>
            <Text style={innerStyle.heading}>{`Order #${order.orderId}`}</Text>
          </View>
          <View style={innerStyle.row}>
            <Text style={innerStyle.label}>Customer Name:</Text>
            <Text style={innerStyle.value}>{order?.address.name}</Text>
          </View>

          {/* Address */}
          <View style={innerStyle.row}>
            <Text style={innerStyle.label}>Address:</Text>
            <Text style={innerStyle.value}>{order.address.addressLine1}</Text>
          </View>

          {/* Landmark */}
          <View style={innerStyle.row}>
            <Text style={innerStyle.label}>Landmark:</Text>
            <Text style={innerStyle.value}>{order.address.landmark}</Text>
          </View>

          {/* Quantity */}
          <View style={innerStyle.row}>
            <Text style={innerStyle.label}>Quantity:</Text>
            <Text style={innerStyle.value}>{order.items.length}</Text>
          </View>

          {/* Price */}
          <View style={innerStyle.row}>
            <Text style={innerStyle.label}>Price:</Text>
            <Text
              style={[innerStyle.value, { color: 'green', fontWeight: '600' }]}
            >
              {items?.price === null
                ? 'Out of Stock'
                : `₹${totalAmount.toFixed(2)}`}
            </Text>
          </View>
        </View>
      ),
      confirmText: 'Dispatch',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Order dispatch canceled');
      },
      onConfirm: async () => {
        try {
          if (!order) {
            Alert.alert('Error', 'Order not found.');
            showToast(
              'error',
              'Order not found',
              err?.message || 'Please try again',
            );
            return;
          }

          const orderItem = parsedItems.map(item => {
            const itemId = item.itemId || item.id || item.productId;
            const isOutOfStock = outOfStockMap[itemId];
            return {
              itemId,
              price: isOutOfStock ? null : parseFloat(prices[itemId]),
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
              price: parseFloat(prices[itemId]),
            };
          });

          dispatch(
            updateOrderPrices({ orderId, items: updatedItemsWithPrices }),
          );
          dispatch(updateOrderStatus({ orderId, newStatus: 'DISPATCHED' }));

          if (storeKeeperNote) {
            dispatch(updateOrderNote({ orderId, storeKeeperNote }));
          }
          showToast('success', 'Order Dispatched Successfully');
        } catch (error) {
          console.log(error);
          showToast(
            'error',
            'Failed to Dispatch order',
            error?.message || 'Please try again',
          );
        }
      },
    });
  };

  const handleDeliver = orderId => {
    showDialog({
      title: 'Deliver Order',
      message: 'Are you sure, you want to Deliver this order?',
      confirmText: 'Deliver',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Delivery Canceled');
      },

      onConfirm: async () => {
        try {
          const payload = { orderStatus: 'DELIVERED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(
            updateOrderStatus({
              orderId: orderId,
              newStatus: 'DELIVERED',
            }),
          );
          navigation.goBack();
          console.log('Order marked as delivered');
          showToast('success', 'Order Delivered Successfully');
        } catch (error) {
          console.log(error);
          showToast(
            'error',
            'Failed to Deliver order',
            err?.message || 'Please try again',
          );
        }
      },
    });
  };

  const allPricesZero = parsedItems.every(item => {
    const itemId = item.itemId || item.id || item.productId;
    const price = prices[itemId];
    return !price || parseFloat(price) === 0;
  });
  // Calculate total amount (add right before return statement)
  const totalAmount = parsedItems.reduce((sum, item) => {
    const itemId = item.itemId || item.id || item.productId;
    return sum + (parseFloat(prices[itemId]) || 0);
  }, 0);

  return (
    <View style={[styles.pageContainer, { flex: 1 }]}>
      <BackButton title="Order Details" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View>
                <Text style={innerStyle.heading1}>Delivery Address</Text>
                <View style={innerStyle.AddressCard}>
                  <View style={innerStyle.rowBetween}>
                    <Text style={innerStyle.addressCardDetails}>
                      {`${strings.customer} `}
                      {order?.address?.name}
                    </Text>
                    {(isInProgress || isDispatched) && (
                      <TouchableOpacity
                        ref={dotRef}
                        onPress={() => {
                          dotRef.current?.measureInWindow(
                            (x, y, width, height) => {
                              setPopupPosition({
                                x: x + width - 160, // shift left so popup doesn't go off-screen
                                y: y + height + 5, // place just below the dots
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
                      {`${strings.mobile} :`} {order?.address?.mobileNumber}
                    </Text>
                  </View>
                  <Text style={innerStyle.addressCardDetails}>
                    {strings.address}
                    {order?.address?.addressLine1},{order?.address?.landmark}
                  </Text>
                </View>
                <View style={innerStyle.totalContainer}>
                  <View>
                    <Text style={innerStyle.orderDetailsHeading}>
                      Ordered On:
                      <Text style={innerStyle.normalText}>
                        {new Date(order?.orderDate).toLocaleDateString('en-GB')}
                      </Text>
                    </Text>
                  </View>
                  {isDelivered && (
                    <View>
                      <Text style={innerStyle.orderDetailsHeading}>
                        Delivered On:
                        <Text style={innerStyle.normalText}>
                          {new Date(order?.updatedAt).toLocaleDateString(
                            'en-GB',
                          )}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
                <View style={innerStyle.totalContainer}>
                  <Text style={innerStyle.heading}>Order ID: #{orderId}</Text>
                  <View>
                    <Text style={innerStyle.totalText}>
                      Total: ₹{totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
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
                    hasError={priceErrors[itemId]}
                  />
                );
              })}

              {(isInProgress ||
                ((isDispatched || isDelivered) && storeKeeperNote?.trim())) && (
                <View style={{ marginTop: 10, flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      fontSize: Fonts.sizes.base,
                      color: Colors.secondary,
                    }}
                  >
                    Note :
                  </Text>

                  {isInProgress ? (
                    <TextInput
                      multiline
                      style={[
                        innerStyle.noteInput,

                        {
                          textAlignVertical: 'top',
                        },
                      ]}
                      placeholder="Write a note to the customer about this order"
                      placeholderTextColor={Colors.secondaryText}
                      value={storeKeeperNote}
                      editable={true}
                      scrollEnabled={false}
                      onChangeText={setStoreKeeperNote}
                      returnKeyType="done"
                    />
                  ) : (
                    <Text
                      style={{
                        fontStyle: 'italic',
                        color: Colors.secondary,
                        fontSize: 15,
                      }}
                      // numberOfLines={1}
                      // ellipsizeMode="tail"
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
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm, // already responsive from Fonts
    fontWeight: Fonts.weights.bold,
  },
  label: {
    color: Colors.secondary,
  },
  value: {
    color: Colors.secondary,
  },

  heading: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    // marginBottom: '10@vs',
    color: Colors.secondary,
  },
  heading1: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    marginBottom: '10@vs',
    color: Colors.secondary,
  },
  card: {
    // Android shadow
    elevation: 2,
    // Add iOS shadow for parity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // rest styles
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: '10@s',
    borderRadius: '10@s',
    marginBottom: '10@vs',
    height: '90@vs',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  accessoryContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
  },
  doneText: {
    fontSize: Fonts.sizes.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  fixedButtonWrapper: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    backgroundColor: Colors.white,
    paddingVertical: '10@vs',
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  noteInput: {
    color: Colors.secondary,
    height: '100@vs', // vertical scaling for height
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '10@ms', // moderate scaling for border radius
    padding: '10@ms', // padding scaled
    // textAlignVertical: 'top',
    backgroundColor: Colors.white,

    // marginBottom: '50@vs',
  },

  image: {
    width: '80@s',
    aspectRatio: 1,
    borderRadius: '10@s',
    resizeMode: 'cover',
  },
  title: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    color: Colors.secondary,
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
    marginBottom: '5@vs',
  },
  toggle: {
    width: '80@s',
    height: '35@vs',
    borderRadius: '20@s',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    gap: '2@s',
  },
  toggleText: {
    fontSize: Fonts.sizes.xxs,
    color: Colors.white,
    flexWrap: 'wrap',
  },
  toggleOn: {
    backgroundColor: Colors.reject,
    paddingHorizontal: '5@s',
    width: '80@s',
  },
  toggleOff: {
    backgroundColor: Colors.primary,
    paddingHorizontal: '10@s',
    width: '80@s',
  },
  circle: {
    width: '16@s',
    height: '16@s',
    borderRadius: '8@s',
    backgroundColor: Colors.white,
  },

  input: {
    width: '80@s',
    height: '35@vs',
    width: '80@s',
    height: '35@vs',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: Colors.secondary,
    // lineHeight: 20,
    // includeFontPadding: false,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '10@s',
  },
  totalText: {
    fontSize: '16@s',
    fontWeight: 'bold',
    color: Colors.primary,
  },
  orderDetails: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  orderDetailsHeading: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 600,
    color: Colors.secondary,
    width: '100%',
    justifyContent: 'space-between',
  },
  normalText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 4,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});
