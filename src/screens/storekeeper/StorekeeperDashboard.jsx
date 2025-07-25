import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  findNodeHandle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
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

const StorekeeperDashboard = () => {
  const [formState, setFormState] = useState(0);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [popupOrderId, setPopupOrderId] = useState(null);
  const [popupCoords, setPopupCoords] = useState({ x: 0, y: 0 });
  const dotRefs = useRef({});
  const { token } = useAuth();

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const tab = route?.params?.tab;

  const statusTabs = [
    { label: 'PENDING', statuses: ['PENDING'] },
    { label: 'IN_PROGRESS', statuses: ['IN_PROGRESS', 'DISPATCH'] },
    { label: 'DELIVERED', statuses: ['DELIVERED'] },
  ];

  const orders = useSelector(state => state.storekeeperOrders.orders);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        if (!token) return;
        const ordersData = await getOrders(token);
        dispatch(setOrders(ordersData));
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to fetch orders');
      }
    };
    loadOrders();
  }, [dispatch, token]);

  useEffect(() => {
    const tabIndex = statusTabs.findIndex(
      t => t.label.toLowerCase() === tab?.toLowerCase(),
    );
    if (tabIndex !== -1) setFormState(tabIndex);
  }, [tab]);

  const filteredOrders = orders.filter(order =>
    statusTabs[formState].statuses.includes(order.orderStatus),
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
        },
      },
    ]);
  };

  const showPopup = (orderId, ref) => {
    ref?.measureInWindow((x, y, width, height) => {
      setPopupCoords({ x: x + width - 160, y: y + height });
      setPopupOrderId(orderId);
    });
  };

  return (
    <View style={styles.pageContainer}>
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

      {filteredOrders.length === 0 ? (
        <View style={innerStyle.emptyStateContainer}>
          <Text style={innerStyle.emptyStateText}>
            No {formatTabLabel(statusTabs[formState].label)} orders found.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ paddingHorizontal: 20, marginTop: 20 }}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {filteredOrders.map(order => (
            <Pressable
              key={order.orderId}
              style={innerStyle.orderCard}
              onPress={() => handleDetails(order)}
            >
              <View>
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

              <View
                style={{
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                >
                  <Text style={innerStyle.orderDetails}>{order.date}</Text>
                  {order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELLED' && (
                      <Pressable
                        ref={ref => (dotRefs.current[order.orderId] = ref)}
                        onPress={() =>
                          showPopup(
                            order.orderId,
                            dotRefs.current[order.orderId],
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
          ))}
        </ScrollView>
      )}

      <ConnectPopup
        visible={!!popupOrderId}
        onClose={() => setPopupOrderId(null)}
        position={popupCoords}
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
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
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