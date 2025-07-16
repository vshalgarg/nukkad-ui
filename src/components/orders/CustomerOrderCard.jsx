import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart, clearCart } from '../../store/cartSlice';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';
import { addToCartAPI } from '../../services/customer/cartService';
import { useAuth } from '../../contexts/authContext';


const CustomerOrderCard = ({ order, onPress, isExpanded, expandedView }) => {
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
          price: item.price || 0,
        };

        const cartItem = {
          itemId: addedItemId,
          product,
          selectedUnit: unit,
          quantity: itemCount,
        };
        dispatch(addToCart(cartItem));
      }

      safePush('ShoppingCart',{ fromRepeatOrder: true });
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
        <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Text style={styles.storeName}>Store: {shopName}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.quantity}>Total Items: {totalQuantity}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <TouchableOpacity onPress={handleRepeatOrder}>
          <Text style={styles.repeat}>Repeat Order</Text>
        </TouchableOpacity>
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
    marginHorizontal:16,
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
    alignItems: 'center',
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
  storeName: {
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 15,
    color: Colors.secondaryText,
  },
  quantity: {
    fontSize: 14,
    color: Colors.text,
  },
  repeat: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  expanded: {
    marginTop: 12,
    paddingTop: 10,
  },
});
