import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FilterModal from '../../components/orders/FilterModal';
import { FlashList } from '@shopify/flash-list';

import BackButton from '../../components/BackButton';
import OrderHistory from '../../components/orders/OrderHistory';
import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';

import { useAuth } from '../../contexts/authContext';
import { fetchOrderHistory } from '../../services/common/OrderHistoryService';
import { ScaledSheet } from 'react-native-size-matters';

const Orders = () => {
  const { token, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [filterParams, setFilterParams] = useState({});

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const size = 10;

  // const fetchOrders = useCallback(async () => {
  //   if (!token) return;
  //   try {
  //     const res = await fetchOrderHistory(token);

  //     setOrders(Array.isArray(res.orders) ? res.orders : []);
  //   } catch (err) {
  //     console.error('❌ Failed to fetch orders:', err);
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // }, [token]);

  const fetchOrders = useCallback(
    async (page = 0, filters = {}) => {
      if (!token) return;

      try {
        const res = await fetchOrderHistory(token, {
          page,
          size,
          ...filters,
        });

        const fetchedOrders = Array.isArray(res.orders) ? res.orders : [];

        if (page === 0) {
          setOrders(fetchedOrders);
        } else {
          setOrders(prev => [...prev, ...fetchedOrders]);
        }

        setHasMore(fetchedOrders.length === size);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!authLoading && token) {
      setPage(0);
      fetchOrders(0);
    }
  }, [authLoading, token, role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchOrders(0, isFilterApplied ? filterParams : {});
  };

  const toggleExpand = id => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

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

      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null),
      );

      setFilterParams(cleanedParams);
      setIsFilterApplied(true);
      setPage(0);
      await fetchOrders(0, cleanedParams);
      setFilterModalVisible(false);
    } catch (err) {
      console.error(' Filtered Order Fetch Failed:', err);
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

      <FlashList
        data={orders}
        keyExtractor={item => item.orderId?.toString()}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={200}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            setIsLoadingMore(true);
            setPage(prev => {
              const next = prev + 1;
              fetchOrders(next, isFilterApplied ? filterParams : {});
              return next;
            });
          }
        }}
        onEndReachedThreshold={0.5} // when 50% near bottom
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        extraData={expandedOrderId}
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
                        item.orderStatus === 'DISPATCHED') && (
                        <Text> {itm.price > 0 ? `₹${itm.price}` : "Out of Stock"}</Text>
                      )}
                    </View>
                    <View
                      style={{
                        height: 0.4,
                        width: '100%',
                        backgroundColor: Colors.grayLine,
                      }}
                    />
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
                      {item.storeKeeperNote.trim()}
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

const localStyles = ScaledSheet.create({
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: '16@s',
    marginVertical: '12@vs',
  },
  expandedView: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    paddingTop: '10@vs',
  },
  noteColumn: {
    marginTop: '10@vs',
  },
  noteTitle: {
    fontWeight: 'bold',
  },
  itemsTitle: {
    fontWeight: 'bold',
    marginBottom: '8@vs',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowAlign: {
    flexDirection: 'row',
    marginVertical: '10@vs',
    justifyContent: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontWeight: '500',
  },
  itemText: {
    color: Colors.secondary,
  },
});
