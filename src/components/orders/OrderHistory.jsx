import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart, clearCart } from '../../store/cartSlice';
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

  const formattedDate = new Date(order.orderDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleRepeatOrder = async () => {
    if (!order.items || order.items.length === 0) {
      Alert.alert('No items to reorder');
      return;
    }
    await clearCartAPI(token);

    dispatch(clearCart());

    try {
      for (const item of order.items) {
        const itemId = item.itemId;
        const unit = item.unit;
        const quantity = item.quantity;
        const amount = quantity.toString();
        const isPkt = unit === 'PKT';
        const itemCount = isPkt ? Number(quantity) : 1;

        // 🔁 Call addToCart API to sync backend
        const response = await addToCartAPI(itemId, quantity, unit, token);
        const addedItemId = response?.itemIds?.[0] || response?.id || itemId;

        const product = {
          _id: itemId,
          name: item.itemName,
          selectedUnit: unit,
          amount: amount,
        };

        const cartItem = {
          itemId: addedItemId,
          product,
          selectedUnit: unit,
          quantity: itemCount,
        };
        dispatch(addToCart(cartItem));
      }

      safePush('ShoppingCart', { fromRepeatOrder: true });
    } catch (err) {
      console.error('Repeat Order Failed:', err.message || err);
    }
  };

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
      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {`${strings.orderId}: #${order.orderId}`}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
          {role === 'CUSTOMER'
            ? `${strings.store} ${shopName}`
            : `${strings.customer} ${order.customerName}`}
        </Text>
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
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <Text style={styles.label}>
          {strings.totalItems}{' '}
          <Text style={styles.values}>{totalQuantity}</Text>
        </Text>
        {role === 'CUSTOMER' && (
          <TouchableOpacity onPress={handleRepeatOrder}>
            <Text style={styles.repeat}>{strings.repeatOrder}</Text>
          </TouchableOpacity>
        )}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6@s',
    marginBottom: '6@vs',
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
