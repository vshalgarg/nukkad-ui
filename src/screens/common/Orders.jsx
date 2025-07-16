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
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import BackButton from '../../components/BackButton';
import CustomerOrderCard from '../../components/orders/CustomerOrderCard';
import StorekeeperOrderCard from '../../components/orders/StorekeeperOrderCard';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import styles from '../../styles/globalStyles';

import { useAuth } from '../../contexts/authContext';
import { getOrderHistory } from '../../services/common/OrderHistoryService';

const Orders = () => {
  const { token, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isCustomer = role === 'CUSTOMER';
  const isStorekeeper = role === 'STOREKEEPER';

  useEffect(() => {
    if (authLoading || !token || (!isCustomer && !isStorekeeper)) return;

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

  const toggleExpand = id => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const formatDate = date => {
    if (!date || isNaN(new Date(date))) return 'Select';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const applyFilter = () => {
    const today = new Date();
    const maxToDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    if (tempFrom && tempTo && tempTo < tempFrom) {
      Alert.alert('Invalid Date', "'To' date must be after 'From' date.");
      return;
    }

    if (tempTo && tempTo > maxToDate) {
      Alert.alert('Invalid Date', "'To' date cannot be in the future.");
      return;
    }

    setFromDate(tempFrom);
    setToDate(tempTo);
    setFilterModalVisible(false);
  };

  const filteredOrders = orders
    .filter(order => {
      if (!order.orderDate) return false;
      const orderDate = new Date(order.orderDate);
      if (isNaN(orderDate)) return false;

      const afterFrom = !fromDate || orderDate >= new Date(fromDate);
      const beforeTo =
        !toDate || orderDate <= new Date(toDate.setHours(23, 59, 59));
      const statusMatch = !selectedStatus || order.status === selectedStatus;

      const price = Number(order.totalAmount || 0);
      const minOk = !minPrice || price >= parseFloat(minPrice);
      const maxOk = !maxPrice || price <= parseFloat(maxPrice);

      return afterFrom && beforeTo && statusMatch && minOk && maxOk;
    })
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  if (authLoading || loading) {
    return (
      <View style={styles.pageContainer}>
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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={localStyles.bottomSheetOverlay}>
          <View style={localStyles.bottomSheetContainer}>
            <Text style={localStyles.modalTitle}>Filter Orders</Text>

            <TouchableOpacity
              style={localStyles.dateSelect}
              onPress={() => {
                setActivePicker('from');
                setShowDatePicker(true);
              }}
            >
              <Text style={localStyles.dateLabel}>
                From: {formatDate(tempFrom)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={localStyles.dateSelect}
              onPress={() => {
                setActivePicker('to');
                setShowDatePicker(true);
              }}
            >
              <Text style={localStyles.dateLabel}>
                To: {formatDate(tempTo)}
              </Text>
            </TouchableOpacity>

            <Text style={localStyles.sectionTitle}>Order Status</Text>
            <View style={localStyles.statusRow}>
              {['PENDING', 'COMPLETED', 'CANCELLED'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    localStyles.statusBtn,
                    selectedStatus === status && {
                      backgroundColor: Colors.primary,
                    },
                  ]}
                  onPress={() =>
                    setSelectedStatus(prev => (prev === status ? null : status))
                  }
                >
                  <Text
                    style={[
                      localStyles.statusText,
                      selectedStatus === status && { color: Colors.bgClr },
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={localStyles.sectionTitle}>Price Range</Text>
            <View style={localStyles.priceRow}>
              <TextInput
                placeholder="Min"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
                style={localStyles.priceInput}
              />
              <Text style={{ marginHorizontal: 8 }}>to</Text>
              <TextInput
                placeholder="Max"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
                style={localStyles.priceInput}
              />
            </View>

            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={localStyles.cancelBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={localStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={localStyles.modalBtn}
                onPress={applyFilter}
              >
                <Text style={localStyles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={
            activePicker === 'from'
              ? tempFrom || new Date()
              : tempTo || new Date()
          }
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type !== 'set') return;

            const today = new Date();
            const maxToDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              23,
              59,
              59,
            );

            if (activePicker === 'from') {
              setTempFrom(selectedDate);
              if (tempTo && selectedDate > tempTo) setTempTo(null);
            } else {
              if (tempFrom && selectedDate < tempFrom) {
                Alert.alert(
                  'Invalid Date',
                  "'To' date cannot be before 'From' date.",
                );
                return;
              }
              if (selectedDate > maxToDate) {
                Alert.alert(
                  'Invalid Date',
                  "'To' date cannot be in the future.",
                );
                return;
              }
              setTempTo(selectedDate);
            }
          }}
        />
      )}

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.orderId?.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50 }}>
            No orders found.
          </Text>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.orderId;
          const commonProps = {
            order: item,
            isExpanded,
            onPress: () => toggleExpand(item.orderId),
            expandedView: (
              <View style={localStyles.expandedView}>
                <Text style={localStyles.itemsTitle}>Items:</Text>
                {item.items.map((itm, idx) => (
                  <View key={idx} style={localStyles.itemRow}>
                    <Text style={localStyles.itemName}>{itm.itemName}</Text>
                    <Text style={localStyles.itemText}>
                      {itm.quantity} {itm.unit}
                    </Text>
                  </View>
                ))}
              </View>
            ),
          };

          return isCustomer ? (
            <CustomerOrderCard {...commonProps} />
          ) : (
            <StorekeeperOrderCard {...commonProps} />
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
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomSheetContainer: {
    backgroundColor: Colors.bgClr,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  dateSelect: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginRight: 8,
    marginBottom: 8,
  },
  statusText: {
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.secondaryText,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  buttonText: {
    color: Colors.bgClr,
    fontWeight: '600',
  },
  expandedView: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    paddingTop: 10,
  },
  itemsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontWeight: '500',
  },
  itemText: {
    color: Colors.secondary,
  },
});
