import React, { useState, memo } from 'react';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import Mobile from '../../../assets/images/contact.svg';
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
      <View style={innerStyle.card}>
        <Image source={{ uri: item.image }} style={innerStyle.image} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={innerStyle.title}>{itemTitle}</Text>
          <Text style={innerStyle.text}>Weight: {itemWeight}</Text>
        </View>

        <View>
          {isEditable && (
            <View style={innerStyle.toggleWrapper}>
              <Text style={innerStyle.text}>Out of Stock</Text>
              <TouchableWithoutFeedback
                onPress={() => onToggleOutOfStock(itemId)}
              >
                <View
                  style={[
                    innerStyle.toggle,
                    outOfStock ? innerStyle.toggleOn : innerStyle.toggleOff,
                  ]}
                >
                  <View
                    style={[
                      innerStyle.circle,
                      outOfStock && { alignSelf: 'flex-end' },
                    ]}
                  />
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
              value={`₹ ${price || '0'}`}
              editable={false}
            />
          )}
        </View>
      </View>
    );
  },
);

const ShowDetails = () => {
  const [note, setNote] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const { token } = useAuth();

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { orderId, items } = route.params;
  const parsedItems = JSON.parse(items);

  const order = useSelector(state =>
    state.storekeeperOrders.orders.find(order => order.orderId === orderId),
  );

  const isInProgress = order?.status === 'IN_PROGRESS';
  const isDispatched = order?.status === 'DISPATCHED';
  const isDelivered = order?.status === 'DELIVERED';
  const isRejected = order?.status === 'CANCELLED';
  const isPending = !isDelivered && !isRejected;
  const [outOfStockMap, setOutOfStockMap] = useState(
    parsedItems.reduce((acc, item) => {
      const itemId = item.itemId || item.id || item.productId;
      acc[itemId] = false;
      return acc;
    }, {}),
  );

  const [prices, setPrices] = useState(
    parsedItems.reduce((acc, item) => {
      const itemId = item.id || item.productId;
      const matchedItem = order?.items.find(
        ordItem => (ordItem.id || ordItem.productId) === itemId,
      );
      acc[itemId] = matchedItem?.price || '';
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
            const payload = { status: 'CANCELLED' };

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
    const allPricesEntered = parsedItems.every(item => {
      const itemId = item.itemId || item.id || item.productId;
      return prices[itemId] && prices[itemId].trim() !== '';
    });

    if (!allPricesEntered) {
      Alert.alert(
        'Missing Prices',
        'Please enter prices for all items before dispatching.',
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
              note: note.trim(),
              orderItem,
            };

            await dispatchOrder(payload, token);

            // ✅ Update Redux state
            dispatch(updateOrderPrices({ orderId, items: parsedItems }));
            dispatch(updateOrderStatus({ orderId, newStatus: 'DISPATCHED' }));
            if (note.trim()) {
              dispatch(updateOrderNote({ orderId, note: note.trim() }));
            }

            Alert.alert('Success', 'Order dispatched successfully!');
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
            const payload = { status: 'DELIVERED' };

            await updateOrderStatusById(orderId, payload, token);

            dispatch(
              updateOrderStatus({
                orderId: orderId,
                newStatus: 'DELIVERED',
              }),
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.pageContainer, { flex: 1 }]}>
          <BackButton title="Order Details" />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <FlatList
              data={parsedItems}
              keyExtractor={(item, index) =>
                item.id || item.productId || index.toString()
              }
              contentContainerStyle={{
                padding: 20,
              }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={8}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 115,
                offset: 115 * index,
                index,
              })}
              ListHeaderComponent={
                <View>
                  <Text style={innerStyle.heading}>Delivery Address</Text>
                  <View style={innerStyle.AddressCard}>
                    <Text style={innerStyle.addressCardDetails}>
                      {order.customerName}
                    </Text>
                    <View style={innerStyle.rowBetween}>
                      <Text style={innerStyle.addressCardDetails}>
                        {order.customerMobileNumber}
                      </Text>
                      {(isPending || isDispatched) && (
                        <Mobile
                          onPress={() => setShowPopup(true)}
                          height={40}
                        />
                      )}
                    </View>
                    <Text style={innerStyle.addressCardDetails}>
                      {order.address}
                    </Text>
                  </View>
                  <Text style={innerStyle.heading}>Order ID: #{orderId}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <OrderItem
                  item={item}
                  price={prices[item.itemId]}
                  isEditable={!isDelivered && !isDispatched && !isRejected}
                  onPriceChange={handlePriceChange}
                  outOfStock={outOfStockMap[item.itemId]}
                  onToggleOutOfStock={handleToggleOutOfStock}
                />
              )}
              ListFooterComponent={
                isPending ? (
                  <View style={{ marginTop: 10, marginHorizontal: 5 }}>
                    <Text style={{ marginBottom: 5, fontWeight: 'bold' }}>
                      Note for Customer
                    </Text>
                    <TextInput
                      style={{
                        height: 100,
                        borderWidth: 1,
                        borderColor: Colors.borderColor,
                        borderRadius: 10,
                        padding: 10,
                        textAlignVertical: 'top',
                        backgroundColor: Colors.bgClr,
                      }}
                      multiline
                      placeholder="Write a note to the customer about this order"
                      value={note}
                      onChangeText={setNote}
                    />
                  </View>
                ) : null
              }
            />
          </KeyboardAvoidingView>

          {(isInProgress || isDispatched) && (
            <View style={innerStyle.fixedButtonWrapper}>
              <View style={innerStyle.buttonContainer}>
                {isInProgress && (
                  <>
                    <CustomButton
                      title="Reject Order"
                      onPress={handleReject}
                      style={{ backgroundColor: Colors.reject, borderWidth: 0 }}
                    />
                    <CustomButton
                      title="Dispatch Order"
                      onPress={handleDispatch}
                      style={{ fontSize: Fonts.sizes.sm }}
                    />
                  </>
                )}
                {isDispatched && (
                  <CustomButton
                    title="Deliver Order"
                    onPress={handleDeliver}
                    style={{ backgroundColor: Colors.primary, borderWidth: 0 }}
                  />
                )}
              </View>
            </View>
          )}

          <ConnectPopup
            visible={showPopup}
            onClose={() => setShowPopup(false)}
            phone={order?.mobileNumber || '9999999999'}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
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
    backgroundColor: Colors.bgClr,
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
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 5,
  },
  toggle: {
    width: 45,
    height: 25,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: Colors.reject,
  },
  toggleOff: {
    backgroundColor: Colors.secondaryText,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.bgClr,
  },

  input: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 50,
    paddingHorizontal: 10,
    textAlign: 'left',
    lineHeight: 20,
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
  // fixedButtonWrapper: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   zIndex: 100,
  //   backgroundColor: '#fff',
  //   borderTopWidth: 1,
  //   borderColor: '#ddd',
  //   paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  // },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
});
