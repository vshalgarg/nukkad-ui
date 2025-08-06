import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { getOrders } from '../../services/storekeeper/getOrders';
import SideBar from '../../components/sidebar/SideBar';
import ConnectPopup from '../../components/ConnectPopUp';
import {
  updateOrderStatus,
  setOrders,
} from '../../store/storekeeperOrdersSlice';
import Colors from '../../styles/colors';
import styles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import textStyles from '../../styles/textStyles';
import { useAuth } from '../../contexts/authContext';
import { updateOrderStatusById } from '../../services/storekeeper/orderStatusService';
import { formatTabLabel } from '../../utils/formatTabLabel';
import useBackHandlerControl from '../../hooks/useBackHandlerControl';

const StorekeeperDashboard = () => {
  useBackHandlerControl({ confirmBack: true });
  const [formState, setFormState] = useState(0);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [popupOrderId, setPopupOrderId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [popupCards, setPopupCards] = useState({ x: 0, y: 0 });
  const dotRefs = useRef({});
  const { token } = useAuth();
  // Component state for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const size = 10;

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const tab = route?.params?.tab;

  const statusTabs = [
    { label: 'PENDING', statuses: ['PENDING'] },
    { label: 'IN_PROGRESS', statuses: ['IN_PROGRESS', 'DISPATCHED'] },
    { label: 'DELIVERED', statuses: ['DELIVERED'] },
  ];

  const orders = useSelector(state => state.storekeeperOrders.orders);

  const loadOrders = async (status, page = 0, append = false) => {
    try {
      if (!token) return;

      // Set loading states

      setLoadingMore(true);

      const orderData = await getOrders(token, status, page, size);

      dispatch(
        setOrders({
          orders: orderData.orders,
          append,
        }),
      );

      // Determine if more pages exist
      setHasMore(orderData.orders.length > 0);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    } finally {
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const currentStatus = statusTabs[formState].statuses[0];
      setCurrentPage(0);
      loadOrders(currentStatus, 0, false);
    }, [formState, token]),
  );
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const currentStatus = statusTabs[formState].statuses[0];
      const nextPage = currentPage + 1;
      loadOrders(currentStatus, nextPage, true);
      setCurrentPage(nextPage);
    }
  };

  useEffect(() => {
    const currentStatus = statusTabs[formState].statuses[0]; // Keep category filtering
    setCurrentPage(0); // Reset to first page when category changes
    loadOrders(currentStatus, 0, false); // Pass status and page
  }, [formState, token]);

  const handleRefresh = async () => {
    const currentStatus = statusTabs[formState].statuses[0];
    setRefreshing(true); // ⬅️ start spinner manually
    setCurrentPage(0);

    await loadOrders(currentStatus, 0, false);

    // ⏱️ Add this delay to make spinner visible longer
    await new Promise(res => setTimeout(res, 700));

    setRefreshing(false); // ⬅️ stop spinner manually
  };

  useEffect(() => {
    const tabIndex = statusTabs.findIndex(
      t => t.label.toLowerCase() === tab?.toLowerCase(),
    );
    if (tabIndex !== -1) setFormState(tabIndex);
  }, [tab]);

  const filteredOrders = (Array.isArray(orders) ? [...orders] : []).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  );

  const safePush = routeObj => {
    try {
      navigation.navigate(routeObj?.pathname, routeObj?.params || {});
    } catch (err) {
      console.error('Navigation Error:', err);
    }
  };

  const handleDetails = async order => {
    try {
      if (order.orderStatus === 'PENDING') {
        const payload = { orderStatus: 'IN_PROGRESS' };
        await updateOrderStatusById(order.orderId, payload, token);
        dispatch(
          updateOrderStatus({
            orderId: order.orderId,
            newStatus: 'IN_PROGRESS',
          }),
        );
      }

      safePush({
        pathname: 'ShowDetails',
        params: {
          orderId: order.orderId,
          items: JSON.stringify(order.items),
          fromTab: statusTabs[formState].label,
        },
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update order status.');
    }
  };

  const handleReject = orderId => {
    Alert.alert('Reject Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const payload = { orderStatus: 'CANCELLED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(updateOrderStatus({ orderId, newStatus: 'CANCELLED' }));
          const currentStatus = statusTabs[formState].statuses[0];
          setCurrentPage(0);
          loadOrders(currentStatus, 0, false);
        },
      },
    ]);
  };

  const handleDeliver = orderId => {
    Alert.alert('Deliver Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Deliver',
        onPress: async () => {
          const payload = { orderStatus: 'DELIVERED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(updateOrderStatus({ orderId, newStatus: 'DELIVERED' }));
          const currentStatus = statusTabs[formState].statuses[0];
          setCurrentPage(0);
          loadOrders(currentStatus, 0, false);
        },
      },
    ]);
  };

  const showPopup = (orderId, ref) => {
    ref?.measureInWindow((x, y, width, height) => {
      setPopupCards({ x: x + width - 160, y: y + height });
      setPopupOrderId(orderId);
    });
  };

  return (
    <View style={[styles.pageContainer]}>
      <View style={innerStyle.topBar}>
        <TouchableOpacity onPress={() => setIsSideBarOpen(true)}>
          <MaterialIcons name="menu" size={26} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={[innerStyle.heading, textStyles.subheading]}>
          My Orders
        </Text>
        <TouchableOpacity
          onPress={() => safePush({ pathname: 'Notification' })}
        >
          <FontAwesome5 name="bell" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <SideBar
        isVisible={isSideBarOpen}
        onClose={() => setIsSideBarOpen(false)}
      />

      <View style={innerStyle.orderStatus}>
        {statusTabs.map((tabItem, index) => (
          <Pressable
            key={index}
            style={[
              innerStyle.statusButton,
              formState === index && { backgroundColor: Colors.secondary },
            ]}
            onPress={() => setFormState(index)}
          >
            <Text style={formState === index && { color: Colors.white }}>
              {formatTabLabel(tabItem.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={filteredOrders}
        estimatedItemSize={150}
        keyExtractor={item => item.orderId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingBottom: 30,
          flexGrow: 1,
        }}
        ListEmptyComponent={() => (
          <View style={innerStyle.emptyWrapper}>
            <Text style={innerStyle.emptyStateText}>
              No {formatTabLabel(statusTabs[formState].label)} Orders Found.
            </Text>
          </View>
        )}
        renderItem={({ item: order }) => (
          <Pressable
            key={order.orderId}
            style={innerStyle.orderCard}
            onPress={() => handleDetails(order)}
          >
            <View style={innerStyle.leftSection}>
              <Text style={innerStyle.orderText}>Order #{order.orderId}</Text>
              <Text style={innerStyle.orderDetailsHeading}>
                Customer Name:
                <Text style={innerStyle.orderDetails}>
                  {' '}
                  {order.customerName}
                </Text>
              </Text>
              <Text style={innerStyle.orderDetailsHeading}>
                Address:
                <Text style={innerStyle.orderDetails}>
                  {' '}
                  {order.address}, {order.landmark}
                </Text>
              </Text>
              <Text style={innerStyle.orderDetailsHeading}>
                Quantity:
                <Text style={innerStyle.orderDetails}>
                  {' '}
                  {order.items.length}
                </Text>
              </Text>
              <Text
                style={[
                  innerStyle.updatedStatus,
                  {
                    color:
                      order.orderStatus === 'PENDING'
                        ? 'red'
                        : order.orderStatus === 'IN_PROGRESS'
                        ? 'orange'
                        : order.orderStatus === 'DELIVERED'
                        ? 'green'
                        : 'red',
                  },
                ]}
              >
                {order.orderStatus.toUpperCase()}
              </Text>
            </View>

            <View style={innerStyle.rightSection}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Text style={innerStyle.orderDetails}>{order.date}</Text>
                {order.orderStatus !== 'DELIVERED' &&
                  order.orderStatus !== 'CANCELLED' && (
                    <Pressable
                      ref={ref => (dotRefs.current[order.orderId] = ref)}
                      onPress={() =>
                        showPopup(order.orderId, dotRefs.current[order.orderId])
                      }
                    >
                      <Entypo
                        name="dots-three-vertical"
                        size={18}
                        color={Colors.secondary}
                      />
                    </Pressable>
                  )}
              </View>

              {order.orderStatus !== 'DELIVERED' &&
                order.orderStatus !== 'CANCELLED' &&
                order.orderStatus !== 'DISPATCHED' && (
                  <Pressable
                    style={innerStyle.showDetailsBtn}
                    onPress={() => handleReject(order.orderId)}
                  >
                    <Text style={{ color: Colors.white, fontWeight: '800' }}>
                      Reject
                    </Text>
                  </Pressable>
                )}

              {order.orderStatus === 'DISPATCHED' && (
                <Pressable
                  style={[
                    innerStyle.showDetailsBtn,
                    { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => handleDeliver(order.orderId)}
                >
                  <Text style={{ color: Colors.white, fontWeight: '800' }}>
                    Deliver
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator size="small" color={Colors.secondary} />
            </View>
          ) : null
        }
      />

      <ConnectPopup
        visible={!!popupOrderId}
        onClose={() => setPopupOrderId(null)}
        position={popupCards}
        mobileNumber={
          filteredOrders.find(o => o.orderId === popupOrderId)?.mobileNumber
        }
      />
    </View>
  );
};

export default StorekeeperDashboard;

const innerStyle = StyleSheet.create({
  topBar: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
  },
  orderStatus: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '60%',
    // backgroundColor:"red"
  },
  emptyStateText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondaryText,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: 50,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 12,
    marginTop: 1,
  },
  leftSection: {
    width: '80%',
  },
  rightSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  showDetailsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: Colors.reject,
  },
  orderText: {
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
    lineHeight: 30,
  },
  orderDetails: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  orderDetailsHeading: {
    lineHeight: 30,
    color: Colors.secondaryText,
  },
  updatedStatus: {
    lineHeight: 30,
    fontWeight: '600',
  },
  popupMenu: {
    position: 'absolute',
    top: 20, // adjust to be just below the dot icon
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    elevation: 5,
    zIndex: 1000,
    width: '150%',
  },
  popupItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  popupText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
});
