import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart, clearCart } from '../../store/cartSlice';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';
import { addToCartAPI } from '../../services/customer/cartService';
import { useAuth } from '../../contexts/authContext';

const CustomerOrderCard = ({
  order,
  onPress,
  isExpanded,
  expandedView,
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

    dispatch(clearCart());

    try {
      for (const item of order.items) {
        const itemId = item.itemId;
        const unit = item.unit;
        const quantity = item.quantity;
        const amount = quantity.toString();
        const isPkt = unit?.toLowerCase() === 'pkt';
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
    return item.unit?.toLowerCase() === 'pkt'
      ? sum + Number(item.quantity || 0)
      : sum + 1;
  }, 0);

  const statusColor =
    order.status === 'DELIVERED'
      ? '#4CAF50'
      : order.status === 'CANCELLED'
      ? '#F44336'
      : '#FFC107';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.columnBetween}>
          <Text style={styles.name}>Order ID: {order.orderId}</Text>
          <Text style={styles.name}>
            Store: <Text style={styles.values}>{shopName}</Text>
          </Text>
          <Text style={styles.name}>
            Total Items: <Text style={styles.values}>{totalQuantity}</Text>
          </Text>
          {(order.status === 'DELIVERED' || order.status === 'DISPATCHED') && (
            <Text style={styles.name}>
              Total Price: <Text style={styles.values}>₹{totalPrice}</Text>
            </Text>
          )}
        </View>
        <View style={styles.columnBetween}>
          <Text style={styles.date}>{formattedDate}</Text>
          <View style={styles.columnBetween}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleRepeatOrder}>
            <Text style={styles.repeat}>Repeat Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && <View style={styles.expanded}>{expandedView}</View>}
    </TouchableOpacity>
  );
};

export default CustomerOrderCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgClr,
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
    marginBottom: 8,
  },
  columnBetween: {
    flexDirection: 'column',
    justifyContent: 'space-around',
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
