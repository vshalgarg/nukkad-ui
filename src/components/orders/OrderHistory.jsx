import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart, clearCart, setCartItems } from '../../store/cartSlice';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';
import {
  addToCartAPI,
  clearCartAPI,
} from '../../services/customer/cartService';
import { useAuth } from '../../contexts/authContext';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import { formatTabLabel } from '../../utils/formatTabLabel';
import Entypo from 'react-native-vector-icons/Entypo';
import ConnectPopup from '../../components/ConnectPopUp';

const OrderHistory = ({
  order,
  onPress,
  isExpanded,
  expandedView,
  role,
  totalPrice,
}) => {
  const { safePush } = useSafeRouter();
  const dispatch = useDispatch();
  const shopName = order.storeName || 'Unknown Store';
  const { token } = useAuth();
  const [isRepeating, setIsRepeating] = useState(false);

  // 3-dot popup state
  const [popupOrderId, setPopupOrderId] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const dotRef = useRef(null);

  const formattedDate = new Date(order.orderDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleRepeatOrder = async () => {
    if (!order.items?.length) {
      Alert.alert('No items to reorder');
      return;
    }

    setIsRepeating(true);
    try {
      await clearCartAPI(token);
      dispatch(clearCart());

      const itemsToAdd = order.items.map(item => {
        const { itemId, unit, quantity, itemName } = item;
        const amount = quantity.toString();
        const isPkt = unit === 'PKT';
        const itemCount = isPkt ? Number(quantity) : 1;
        return { itemId, quantity, unit, itemName, amount, itemCount };
      });

      const response = await addToCartAPI(itemsToAdd, token);

      const cartItems = itemsToAdd.map((item, index) => {
        const addedItemId =
          response?.itemIds?.[index] || response?.id || item.itemId;
        return {
          itemId: addedItemId,
          product: {
            _id: addedItemId,
            name: item.itemName || 'Unknown',
            selectedUnit: item.unit || 'PCS',
            amount: item.amount || '1',
          },
        };
      });

      dispatch(setCartItems(cartItems));
      setIsRepeating(false);

      safePush('ShoppingCart', {
        fromRepeatOrder: true,
        originalStoreId: order.storeKeeperId,
        originalStoreName: order.storeName,
      });
    } catch (err) {
      console.error('Repeat Order Failed:', err.message || err);
      Alert.alert(
        'Error',
        'Failed to repeat your order. Please try again later.',
      );
    }
  };

  const getStatusBg = status => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING':
        return Colors.pending;
      case 'IN_PROGRESS':
        return Colors.inProgress;
      case 'DISPATCHED':
        return Colors.dispatch;
      case 'DELIVERED':
        return Colors.delivered;
      case 'CANCELLED':
        return Colors.rejected;
      default:
        return '#eee';
    }
  };

  const getStatusTextColor = status => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING':
        return Colors.pendingText;
      case 'IN_PROGRESS':
        return Colors.inProgressText;
      case 'DISPATCHED':
        return Colors.primary;
      case 'DELIVERED':
        return Colors.deliveredText;
      case 'CANCELLED':
        return Colors.rejectedText;
      default:
        return '#000';
    }
  };

  // Correct showPopup using ref.measureInWindow
  const showPopup = () => {
    if (!dotRef.current) return;
    dotRef.current.measureInWindow((x, y, width, height) => {
      setPopupPosition({ x: x / 2 + x / 10, y: height + 20 });
      setPopupOrderId(order.orderId);
    });
  };

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.card}
      >
        <View style={styles.mainRow}>
          <View style={styles.column}>
            <Text style={styles.label}>
              {strings.orderId}{' '}
              <Text style={styles.values}>#{order.orderId}</Text>
            </Text>
            <Text style={styles.label}>
              {role === 'CUSTOMER'
                ? `${strings.store} ${shopName}`
                : `${strings.customer} ${order?.address?.name}`}
            </Text>
            <Text style={styles.label}>
              {strings.totalItems}{' '}
              <Text style={styles.values}>{order.items?.length}</Text>
            </Text>
            {(order.orderStatus === 'DISPATCHED' ||
              order.orderStatus === 'DELIVERED') && (
              <Text style={styles.label}>
                {strings.totalPrice}{' '}
                <Text style={styles.values}>₹{totalPrice}</Text>
              </Text>
            )}
          </View>

          <View style={styles.columnRight}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={styles.date}>{formattedDate}</Text>
              <TouchableOpacity ref={dotRef} onPress={showPopup}>
                <Entypo
                  name="dots-three-vertical"
                  size={16}
                  color={Colors.secondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.statusBadgeWrapper}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBg(order.orderStatus) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusTextColor(order.orderStatus) },
                  ]}
                >
                  {formatTabLabel(order.orderStatus)}
                </Text>
              </View>
            </View>
            {role === 'CUSTOMER' && (
              <TouchableOpacity onPress={handleRepeatOrder}>
                <Text style={styles.repeat}>
                  {isRepeating ? strings.repeating : strings.repeatOrder}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isExpanded && <View style={styles.expanded}>{expandedView}</View>}
      </TouchableOpacity>

      <ConnectPopup
        visible={!!popupOrderId}
        onClose={() => setPopupOrderId(null)}
        position={popupPosition}
        phone={
          role === 'STOREKEEPER'
            ? order.address?.mobileNumber
            : order?.storekeeperNumber
        }
      />
    </>
  );
};

export default OrderHistory;

const styles = ScaledSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: '12@s',
    padding: '10@s',
    marginBottom: '16@vs',
    marginHorizontal: '16@s',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: '8@s',
  },
  column: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '4@vs',
    minWidth: 0,
  },
  columnRight: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '4@vs',
    minWidth: 0,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  date: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    flexShrink: 0,
  },
  values: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
  },
  repeat: {
    fontWeight: '600',
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    textAlign: 'right',
  },
  statusBadgeWrapper: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: '6@s',
    paddingVertical: '3@vs',
    borderRadius: '20@s',
    minWidth: '60@s',
  },
  statusText: {
    fontWeight: '600',
    fontSize: Fonts.sizes.xs,
    textAlign: 'center',
  },
  expanded: {
    marginTop: '1@vs',
    paddingTop: '10@vs',
  },
});
