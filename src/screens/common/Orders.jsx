import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FilterModal from '../../components/orders/FilterModal';

import BackButton from '../../components/BackButton';
import OrderHistory from '../../components/orders/OrderHistory';
import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';

import { useAuth } from '../../contexts/authContext';
import { getOrderHistory } from '../../services/common/OrderHistoryService';
import { getFilteredOrderHistory } from '../../services/common/OrderHistoryService';

const Orders = () => {
  const { token, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (authLoading || !token) return;

    const fetchOrders = async () => {
      try {
        const res = await getOrderHistory(token);
        setOrders(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('❌ Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, token, role]);
  console.log('orders', orders);

  const toggleExpand = id => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  console.log(orders);

  const applyFilteredOrders = async () => {
    try {
      const params = {
        status: selectedStatus,
        startDate: dateFrom
          ? new Date(dateFrom).toISOString().split('T')[0]
          : null,
        endDate: dateTo ? new Date(dateTo).toISOString().split('T')[0] : null,
        minPrice: minPrice || 0,
        maxPrice: maxPrice || 5000,
      };

      const filtered = await getFilteredOrderHistory(token, params);
      setOrders(Array.isArray(filtered) ? filtered : []);
    } catch (err) {
      console.error('❌ Filtered Order Fetch Failed:', err);
      Alert.alert('Failed to apply filters');
    }
  };

  if (authLoading || loading) {
    return (
      <View
        style={[
          styles.pageContainer,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <BackButton title="My Orders" />

      <View style={localStyles.filterRow}>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <MaterialIcons
            name="filter-list"
            size={24}
            color={Colors.secondary}
          />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={filterModalVisible}
        setOrders={setOrders}
        onClose={() => setFilterModalVisible(false)}
        dateFrom={dateFrom}
        onApplyFilter={applyFilteredOrders}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        activePicker={activePicker}
        setActivePicker={setActivePicker}
        setFilterModalVisible={setFilterModalVisible}
      />

      <FlatList
        data={orders}
        keyExtractor={item => item.orderId?.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50 }}>
            No orders found.
          </Text>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.orderId;
          const totalPrice =
            item.items?.reduce((sum, itm) => {
              return sum + (Number(itm.price) || 0);
            }, 0) || 0;
          const commonProps = {
            order: item,
            isExpanded,
            onPress: () => toggleExpand(item.orderId),
            expandedView: (
              <View style={localStyles.expandedView}>
                <Text style={localStyles.itemsTitle}>Items:</Text>
                {item.items.map((itm, idx) => (
                  <View key={idx}>
                    <View style={localStyles.rowAlign}>
                      <Text style={localStyles.itemName}>
                        {`${itm.itemName} (${itm.quantity} ${itm.unit})`}
                      </Text>
                      {(item.orderStatus === 'DELIVERED' ||
                        item.orderStatus === 'DISPATCH') && (
                        <Text> &#8377;{itm.price}</Text>
                      )}
                    </View>
                    <View
                      style={{
                        height: 0.3,
                        width: '100%',
                        backgroundColor: Colors.grayLine,
                      }}
                    ></View>
                  </View>
                ))}
                {item.storeKeeperNote && (
                  <View style={localStyles.noteColumn}>
                    <Text style={localStyles.noteTitle}>Note : </Text>
                    <Text
                      style={{
                        fontStyle: 'italic',
                        marginTop: 3,
                        fontWeight: '500',
                      }}
                    >
                      {`"${item.storeKeeperNote.trim()}"`}
                    </Text>
                  </View>
                )}
              </View>
            ),
          };
          return (
            <OrderHistory
              {...commonProps}
              totalPrice={totalPrice}
              role={role}
            />
          );
        }}
      />
    </View>
  );
};

export default Orders;

const localStyles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginVertical: 12,
  },

  expandedView: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    paddingTop: 10,
  },
  noteColumn: {
    marginTop: 10,
  },
  noteTitle: {
    fontWeight: 'bold',
  },

  itemsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowAlign: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontWeight: '500',
    // textDecorationLine: 'underline',
    // textDecorationColor: 'red',
  },
  itemText: {
    color: Colors.secondary,
  },
});
