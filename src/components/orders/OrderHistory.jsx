import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
import { useState } from 'react';

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
      console.log('Before clearcartAPI:', performance.now());
      await clearCartAPI(token);
      dispatch(clearCart());
      console.log('Before add to cart API:', performance.now());

      const itemsToAdd = order.items.map(item => {
        const { itemId, unit, quantity, itemName } = item;
        const amount = quantity.toString();
        const isPkt = unit === 'PKT';
        const itemCount = isPkt ? Number(quantity) : 1;

        return { itemId, quantity, unit, itemName, amount, itemCount };
      });
      const response = await addToCartAPI(itemsToAdd, token);
      console.log('After API:', performance.now());
      // update redux
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
      safePush('ShoppingCart', { fromRepeatOrder: true });
    } catch (err) {
      console.error('Repeat Order Failed:', err.message || err);
      Alert.alert(
        'Error',
        'Failed to repeat your order. Please try again later.',
      );
    }
  };

  let TotalItems = order.items?.length;
  const totalQuantity = order.items?.reduce((sum, item) => {
    return item.unit === 'PKT' ? sum + Number(item.quantity || 0) : sum + 1;
  }, 0);

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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.mainRow}>
        {/* Left Column */}
        <View style={styles.column}>
          <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
            {strings.orderId}
            <Text style={styles.values}>{`#${order.orderId}`}</Text>
          </Text>
          <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
            {role === 'CUSTOMER'
              ? `${strings.store} ${shopName}`
              : `${strings.customer} ${order?.address?.name}`}
          </Text>
          <Text style={styles.label}>
            {strings.totalItems} <Text style={styles.values}>{TotalItems}</Text>
          </Text>
          {(order.orderStatus === 'DISPATCHED' ||
            order.orderStatus === 'DELIVERED') && (
            <Text style={styles.label}>
              {strings.totalPrice}
              <Text style={styles.values}>₹{totalPrice}</Text>
            </Text>
          )}
        </View>

        {/* Right Column */}
        <View style={styles.columnRight}>
          <Text style={styles.date}>{formattedDate}</Text>
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
                {order.orderStatus}
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

      {/* Expanded View */}
      {isExpanded && <View style={styles.expanded}>{expandedView}</View>}
    </TouchableOpacity>
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
