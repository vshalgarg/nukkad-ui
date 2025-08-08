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
import { ScaledSheet } from 'react-native-size-matters';

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

 const filteredOrders = (Array.isArray(orders) ? [...orders] : [])
  .filter(order => {
    // For IN_PROGRESS tab (formState === 1), show both IN_PROGRESS and DISPATCHED
    if (formState === 1) {
      return order.orderStatus === 'IN_PROGRESS' || order.orderStatus === 'DISPATCHED';
    }
    // For other tabs, show only orders matching the tab's status
    return order.orderStatus === statusTabs[formState].statuses[0];
  })
  // .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));


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
          setTimeout(() => {
            dispatch(updateOrderStatus({ orderId, newStatus: 'CANCELLED' }));
          }, 1000);
          const currentStatus = statusTabs[formState].statuses[0];
          loadOrders(currentStatus, 0, false);
          setCurrentPage(0);
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
          setTimeout(() => {
            dispatch(updateOrderStatus({ orderId, newStatus: 'DELIVERED' }));
          }, 1000);

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
        {/* <TouchableOpacity
          onPress={() => safePush({ pathname: 'Notification' })}
        >
          <FontAwesome5 name="bell" size={24} color={Colors.secondary} />
        </TouchableOpacity> */}
        <View></View>
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
            {/* Top Section - Order Number + Icons */}
            <View style={innerStyle.topSection}>
              <Text style={innerStyle.orderText}>Order #{order.orderId}</Text>
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

            {/* Middle Section - Customer Info */}
            <View style={innerStyle.middleSection}>
              <Text style={innerStyle.orderDetailsHeading}>
                Customer Name:
                <Text style={innerStyle.orderDetails}> {order.customerName}</Text>
              </Text>
              <Text
                style={innerStyle.orderDetailsHeading}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                Address:
                <Text style={innerStyle.orderDetails}> {order.address}</Text>
              </Text>
               <Text
                style={innerStyle.orderDetailsHeading}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                Landmark:
                <Text style={innerStyle.orderDetails}> {order.landmark}</Text>
              </Text>
              <Text style={innerStyle.orderDetailsHeading}>
                Quantity:
                <Text style={innerStyle.orderDetails}> {order.items.length}</Text>
              </Text>
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

const innerStyle = ScaledSheet.create({
  topBar: {
    padding: '10@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
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
    paddingTop: '60%',
  },
  emptyStateText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondaryText,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: '50@vs',
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