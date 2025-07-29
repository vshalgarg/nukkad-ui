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
      <View style={styles.rowBetween}>
        <View style={styles.columnBetweenDetail}>
          <Text style={styles.name}>Order ID: {order.orderId}</Text>
          {role === 'CUSTOMER' ? (
            <Text style={styles.name}>
              Store: <Text style={styles.values}>{shopName}</Text>
            </Text>
          ) : (
            <Text style={styles.name}>Customer: {order.customerName}</Text>
          )}
          {(order.orderStatus === 'DELIVERED' ||
            order.orderStatus === 'DISPATCHED') && (
            <Text style={styles.name}>
              Total Price: <Text style={styles.values}>₹{totalPrice}</Text>
            </Text>
          )}
          <Text style={styles.name}>
            Total Items: <Text style={styles.values}>{totalQuantity}</Text>
          </Text>
        </View>
        <View style={styles.columnBetweenStatus}>
          <Text style={styles.date}>{formattedDate}</Text>
          <View style={styles.columnBetween}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBg(order.orderStatus) },
              ]}
            >
              <Text
                style={{
                  color: getStatusTextColor(order.orderStatus),
                  fontWeight: '600',
                  fontSize: Fonts.sizes.sm,
                  textAlign: 'center',
                }}
              >
                {order.orderStatus}
              </Text>
            </View>
          </View>

          {role === 'CUSTOMER' && (
            <TouchableOpacity onPress={handleRepeatOrder}>
              <Text style={styles.repeat}>Repeat Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isExpanded && <View style={styles.expanded}>{expandedView}</View>}
    </TouchableOpacity>
  );
};

export default OrderHistory;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnBetweenDetail: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  columnBetweenStatus: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems:"flex-end"
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.secondary,
  },
  date: {
    fontSize: 14,
    color: Colors.primary,
  },
  name: {
    marginBottom: 8,
    fontWeight: '500',
    fontSize: Fonts.sizes.md,

    color: Colors.secondary,
  },
  values: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  repeat: {
    fontWeight: '600',
    fontSize: Fonts.sizes.md,

    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  expanded: {
    marginTop: 12,
    paddingTop: 10,
  },
});
