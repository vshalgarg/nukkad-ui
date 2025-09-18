import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  FlatList,
  PanResponder,
  Dimensions,
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
import { ScaledSheet } from 'react-native-size-matters';
import { showToast } from '../../utils/toastUtils.js';
import { useDialog } from '../../contexts/DialogContext.js';

const height = Dimensions.get('screen').height;
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

  const [initialLoading, setInitialLoading] = useState(true);

  const { toast } = route.params || {};
  const { showDialog } = useDialog();

  const statusTabs = [
    { label: 'PENDING', statuses: ['PENDING'] },
    { label: 'IN_PROGRESS', statuses: ['IN_PROGRESS', 'DISPATCHED'] },
    { label: 'DELIVERED', statuses: ['DELIVERED'] },
  ];

  const orders = useSelector(state => state.storekeeperOrders.orders);

  const loadOrders = async (status, page = 0, append = false) => {
    try {
      if (!token) return;

      if (page === 0) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      const orderData = await getOrders(token, status, page, size);

      dispatch(
        setOrders({
          orders: orderData.orders,
          append,
        }),
      );

      setHasMore(orderData.orders.length > 0);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log(toast);
    if (toast) {
      try {
        const parsedToast = JSON.parse(toast);
        showToast(parsedToast.type, parsedToast.title);
      } catch (e) {
        console.warn('⚠️ Failed to parse toast:', e.message);
      }
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      const currentStatus = statusTabs[formState].statuses[0];
      dispatch;
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

  const handleRefresh = async () => {
    const currentStatus = statusTabs[formState].statuses[0];
    setRefreshing(true);
    setCurrentPage(0);

    await loadOrders(currentStatus, 0, false);

    await new Promise(res => setTimeout(res, 700));

    setRefreshing(false);
  };

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
    showDialog({
      title: 'Reject Order',
      message: 'Are you sure you want to reject this order?',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Delivery cancelled');
      },
      onConfirm: async () => {
        try {
          const payload = { orderStatus: 'CANCELLED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(updateOrderStatus({ orderId, newStatus: 'CANCELLED' }));
          const currentStatus = statusTabs[formState].statuses[0];
          setCurrentPage(0);
          loadOrders(currentStatus, 0, false);
        } catch (error) {
          console.log(error);
          showToast(
            'error',
            'Failed to reject order',
            error?.message || 'Please try again',
          );
        }
      },
    });
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          setIsSideBarOpen(true); // Open sidebar on right swipe
        }
      },
    }),
  ).current;

  const handleDeliver = orderId => {
    showDialog({
      title: 'Deliver Order',
      message: 'Are you sure you want to deliver this order?',
      confirmText: 'Deliver',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Delivery Delivered');
      },
      onConfirm: async () => {
        try {
          const payload = { orderStatus: 'DELIVERED' };
          await updateOrderStatusById(orderId, payload, token);
          dispatch(updateOrderStatus({ orderId, newStatus: 'DELIVERED' }));
          const currentStatus = statusTabs[formState].statuses[0];
          setCurrentPage(0);
          loadOrders(currentStatus, 0, false);
        } catch (error) {
          console.log(error);
          showToast(
            'error',
            'Failed to reject order',
            err?.message || 'Please try again',
          );
        }
      },
    });
  };

  const showPopup = (orderId, ref) => {
    if (!ref) return;

    ref.measureInWindow((x, y, width, height) => {
      const popupWidth = 160;
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;

      let popupX = x - popupWidth + width;
      if (popupX < 10) popupX = 10; // prevent overflow left
      if (popupX + popupWidth > screenWidth - 10) {
        popupX = screenWidth - popupWidth - 10; // prevent overflow right
      }

      let popupY = y + height + 5;
      if (popupY > screenHeight - 150) {
        popupY = y - 100;
      }

      setPopupCards({ x: popupX, y: popupY });
      setPopupOrderId(orderId);
    });
  };

  const computeOrderTotal = order => {
    if (!order?.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, it) => {
      const price = parseFloat(it.price ?? 0) || 0;
      return sum + price;
    }, 0);
  };

  const formatINR = value =>
    `₹ ${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  return (
    <View
      style={[styles.pageContainer, { flex: 1 }]}
      {...panResponder.panHandlers}
    >
      <View style={innerStyle.topBar}>
        <TouchableOpacity onPress={() => setIsSideBarOpen(true)}>
          <MaterialIcons name="menu" size={26} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={[innerStyle.heading, textStyles.subheading]}>
          My Orders
        </Text>
        {/* <TouchableOpacity
          onPress={() => safePush({ pathname: 'Notification' })}
        >
          <FontAwesome5 name="bell" size={24} color={Colors.secondary} />
        </TouchableOpacity> */}
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
      {initialLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: Colors.white }}
          data={filteredOrders}
          bounces={false}
          removeClippedSubviews={false}
          estimatedItemSize={250}
          keyExtractor={item => item.orderId.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 2,
            paddingBottom: 30,
            backgroundColor: Colors.white,
          }}
          ListEmptyComponent={() => (
            <View
              style={[
                innerStyle.emptyWrapper,
                { flex: 1, minHeight: height * 0.65 },
              ]}
            >
              <Text style={innerStyle.emptyStateText}>
                {/* No {formatTabLabel(statusTabs[formState].label)} Orders Found. */}
                No Orders Found.
              </Text>
            </View>
          )}
          renderItem={({ item: order }) => (
            <Pressable
              key={order.orderId}
              style={innerStyle.orderCard}
              onPress={() => handleDetails(order)}
            >
              {/* Top Section - Order Number + Icons */}
              <View style={innerStyle.topSection}>
                <Text style={innerStyle.orderText}>Order #{order.orderId}</Text>
                {order.orderStatus !== 'DELIVERED' &&
                  order.orderStatus !== 'CANCELLED' && (
                    <Pressable
                      ref={ref => (dotRefs.current[order.orderId] = ref)}
                      onPress={event =>
                        showPopup(
                          order.orderId,
                          dotRefs.current[order.orderId],
                          event,
                        )
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

              {/* Middle Section - Customer Info */}
              <View style={innerStyle.middleSection}>
                <Text style={innerStyle.orderDetailsHeading}>
                  Customer Name:
                  <Text style={innerStyle.orderDetails}>
                    {' '}
                    {order?.address?.name}
                  </Text>
                </Text>
                <Text
                  style={innerStyle.orderDetailsHeading}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  Address:
                  <Text style={innerStyle.orderDetails}>
                    {' '}
                    {order?.address?.addressLine1}
                  </Text>
                </Text>
                <Text
                  style={innerStyle.orderDetailsHeading}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  Landmark:
                  <Text style={innerStyle.orderDetails}>
                    {' '}
                    {order?.address?.landmark}
                  </Text>
                </Text>
                <Text style={innerStyle.orderDetailsHeading}>
                  Quantity:
                  <Text style={innerStyle.orderDetails}>
                    {' '}
                    {order.items.length}
                  </Text>
                </Text>
                {(order.orderStatus === 'DISPATCHED' ||
                  order.orderStatus === 'DELIVERED') && (
                  <Text style={innerStyle.orderDetailsHeading}>
                    Total:
                    <Text style={innerStyle.orderDetails}>
                      {' '}
                      {formatINR(computeOrderTotal(order))}
                    </Text>
                  </Text>
                )}
              </View>

              {/* Bottom Section - Status + Actions */}
              <View style={innerStyle.bottomSection}>
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
                <View style={innerStyle.actionButtons}>
                  {order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELLED' &&
                    order.orderStatus !== 'DISPATCHED' && (
                      <Pressable
                        style={innerStyle.showDetailsBtn}
                        onPress={() => handleReject(order.orderId)}
                      >
                        <Text
                          style={{ color: Colors.white, fontWeight: '800' }}
                        >
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
      )}

      <ConnectPopup
        visible={!!popupOrderId}
        onClose={() => setPopupOrderId(null)}
        position={popupCards}
        phone={
          filteredOrders.find(o => o.orderId === popupOrderId)?.address
            ?.mobileNumber
        }
      />
    </View>
  );
};

export default StorekeeperDashboard;

const innerStyle = ScaledSheet.create({
  topBar: {
    padding: '10@ms',
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
  },

  heading: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  orderStatus: {
    paddingHorizontal: '5@ms',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '20@vs',
    marginBottom: '20@vs',
  },
  statusButton: {
    paddingHorizontal: '20@ms',
    paddingVertical: '8@vs',
    borderRadius: '50@ms',
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondaryText,
  },

  showDetailsBtn: {
    paddingHorizontal: '20@ms',
    paddingVertical: '10@vs',
    borderRadius: '50@ms',
    backgroundColor: Colors.reject,
  },
  orderText: {
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
  },
  orderDetails: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  orderDetailsHeading: {
    lineHeight: '25@vs',
    color: Colors.secondaryText,
  },
  updatedStatus: {
    lineHeight: '20@vs',
    fontWeight: '600',
  },
  popupMenu: {
    position: 'absolute',
    top: '20@vs',
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: '8@ms',
    borderColor: Colors.borderColor,
    borderWidth: 1,
    elevation: 5,
    zIndex: 1000,
    width: '150%',
  },
  popupItem: {
    paddingHorizontal: '16@ms',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  popupText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  orderCard: {
    elevation: 3,
    backgroundColor: Colors.white,
    padding: '10@ms',
    borderRadius: '20@ms',
    marginBottom: '10@vs',
    marginHorizontal: '12@ms',
    marginTop: '1@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  middleSection: {
    marginBottom: '1@vs',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: '10@ms',
  },
});
