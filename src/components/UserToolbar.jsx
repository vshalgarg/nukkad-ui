import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSelector } from 'react-redux';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

import { useNavigation } from '@react-navigation/native';
import { useStore } from '../contexts/storeContext';
import SideBar from './sidebar/SideBar';
import Fonts from '../styles/font';
import Colors from '../styles/colors';
import { ScaledSheet } from 'react-native-size-matters';

const UserToolbar = ({
  hideCart = false,
  hideNotification = false,
  hideMenu = false,
}) => {
  const navigation = useNavigation();

  const { storeData } = useStore();

  const storeName = storeData?.storeName || 'Select Store';

  const cartItems = useSelector(state => state.cart.items);
  const totalItems = cartItems.reduce((total, item) => {
    const isPacket = item.product.selectedUnit?.toLowerCase() === 'pkt';
    return total + (isPacket ? parseInt(item.product.amount) || 0 : 1);
  }, 0);

  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  const handleLocation = () => {
    navigation.navigate('MyStores');
  };

  const moveToCart = () => {
    navigation.navigate('ShoppingCart');
  };

  const handleNotification = () => {
    navigation.navigate('Notification');
  };

  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.leftSection}>
          {!hideMenu ? (
            <TouchableOpacity onPress={() => setIsSideBarOpen(true)}>
              <MaterialIcons name="menu" size={24} color={Colors.secondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Entypo name="chevron-left" size={24} color={Colors.secondary} />
            </TouchableOpacity>
          )}
          <Pressable onPress={handleLocation} style={styles.location}>
            <Ionicons name="storefront-outline" size={20} color="black" />
            <Text style={styles.storeName} numberOfLines={1}
              ellipsizeMode="tail"
            >{storeName}</Text>
          </Pressable>
        </View>

        <View style={styles.rightSection}>
          {!hideCart && (
            <Pressable onPress={moveToCart} style={styles.iconWrapper}>
              <Feather name="shopping-cart" size={24} color="black" />

              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text
                    style={[
                      totalItems > 99
                        ? { fontSize: Fonts.sizes.xxs }
                        : { fontSize: Fonts.sizes.xs },
                      styles.cartBadgeText,
                    ]}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {/* {!hideNotification && (
            <Pressable onPress={handleNotification}>
              <Feather name="bell" size={24} color={Colors.secondary} />
            </Pressable>
          )} */}
        </View>
      </View>

      <SideBar
        isVisible={isSideBarOpen}
        onClose={() => setIsSideBarOpen(false)}
      />
    </>
  );
};

export default UserToolbar;

const styles = ScaledSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '12@ms',
    paddingHorizontal: '10@ms',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '15@ms',
    justifyContent: 'center',
    maxWidth: '80%',

  },
  storeName: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    marginLeft: '5@ms',
  },
  rightSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '20%',
  },
  iconWrapper: {
    marginHorizontal: '10@ms',
  },
  cartBadge: {
    position: 'absolute',
    top: '-6@ms',
    right: '-10@ms',
    backgroundColor: Colors.reject,
    borderRadius: '12@ms',
    minWidth: '22@ms',
    height: '22@ms',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '4@ms',
  },
  cartBadgeText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});
