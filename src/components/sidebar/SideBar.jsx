import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Share from 'react-native-share';
import { useDialog } from '../../contexts/DialogContext.js';
import { useProfile } from '../../contexts/profileContext.js';
import { useSafeRouter } from '../../hooks/useSafeRouter.js';
import { useDispatch } from 'react-redux';
import { useAddress } from '../../contexts/addressContext.js';
import { useStore } from '../../contexts/storeContext.js';
import Fonts from '../../styles/font.js';
import Colors from '../../styles/colors.js';
import { useAuth } from '../../contexts/authContext.js';
import { useStorekeeperProfile } from '../../contexts/storeKeeperProfileContext.js';
import { ScaledSheet } from 'react-native-size-matters';

const screenWidth = Dimensions.get('window').width;

const SideBar = ({ isVisible, onClose }) => {
  const { safePush, safeReplace } = useSafeRouter();
  const slideAnimation = useRef(new Animated.Value(-screenWidth)).current;
  const { profile } = useProfile();
  const { storekeeperProfile } = useStorekeeperProfile();

  const { role } = useAuth();

  const userRole = role;
  const imageUri =
    userRole === 'STOREKEEPER'
      ? storekeeperProfile?.imageUrls?.[0] ?? null
      : profile?.image ?? null;

  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
  const email = profile?.email ?? '';
  const mobile = profile?.mobileNumber || profile?.mobile;

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: isVisible ? 0 : -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const sharePlayStoreLink = async () => {
    try {
      const playStoreLink =
        'https://play.google.com/store/apps/details?id=com.codemonks.nukkad';

      await Share.share({
        title: 'Check out this store app!',
        message: `I found this great store app. Download it now: ${playStoreLink}`,
        social: Share.Social.WHATSAPP,
      });
    } catch (error) {
      console.log('Error sharing:', error);
      Share.open({
        title: 'Share App',
        message:
          'Start Shopping On Nukkad App: https://play.google.com/store/apps/details?id=com.codemonks.nukkad',
      });
    }
  };
  const openLink = async url => {
    try {
      console.log('Trying to open:', url);
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Failed to open URL:', url, error);
    }
  };
  let refer =
    userRole === 'CUSTOMER' ? 'Refer a Store' : 'Refer to another Store';
  const baseMenuItems = [
    ...(userRole !== 'STOREKEEPER'
      ? [
          { name: 'My Stores', icon: 'storefront' },
          { name: 'Add Store', icon: 'add-circle-sharp' },
          { name: 'Addresses', icon: 'location-sharp' },
        ]
      : []),
    { name: `${refer}`, icon: 'share-social-sharp' },
    { name: 'Refer Store to Customer', icon: 'share-social-sharp' },
    { name: 'Help and Support', icon: 'help-circle' },
    { name: 'Privacy Policy', icon: 'shield-half' },
    { name: 'Terms & Conditions', icon: 'document' },
    ...(userRole !== 'STOREKEEPER'
      ? [{ name: 'Rate Store', icon: 'star' }]
      : []),
  ];

  const roleBasedItem =
    userRole === 'CUSTOMER'
      ? { name: 'My Orders', icon: 'bag-add' }
      : { name: 'Order History', icon: 'time' };
  const STOREKEEPERExtraItems =
    userRole === 'STOREKEEPER'
      ? [
          { name: 'Payment Options', icon: 'card' },
          { name: 'Payment QR Code', icon: 'qr-code' },
        ]
      : [];

  const menuItems = [roleBasedItem, ...STOREKEEPERExtraItems, ...baseMenuItems];

  const getRouteForMenuItem = (menuName, userRole) => {
    const routes = {
      ...(userRole !== 'STOREKEEPER' && {
        'Add Store': 'AddStore',
        Addresses: 'Address',
      }),

      'Refer Store to Customer': 'ReferToCustomer',
      'Rate Store': 'RateStore',
      'Payment Options': 'PaymentOptions',
      'My Stores': 'MyStores',
      'Payment QR Code': 'QRCodeScreen',
    };
    if (menuName === 'My Orders' || menuName === 'Order History') {
      return 'Orders';
    }

    return routes[menuName];
  };

  const externalLinks = {
    'Help and Support': 'https://codemonks.in/app/help-and-support.html',
    'Privacy Policy': 'https://codemonks.in/app/privacy-policy.html',
    'Terms & Conditions': 'https://codemonks.in/app/terms-and-condition.html',
  };

  const handleOptionClick = async menuName => {
    onClose();
    if (menuName === 'Refer a Store' || menuName === 'Refer to another Store') {
      await sharePlayStoreLink();
      return;
    }

    if (externalLinks[menuName]) {
      await openLink(externalLinks[menuName]);
      return;
    }

    const routeName = getRouteForMenuItem(menuName, userRole);
    if (routeName) {
      safePush(routeName);
    } else {
      console.warn('No route found for menu item:', menuName);
    }
  };
  if (!isVisible) return null;
  return (
    <>
      <TouchableOpacity style={styles.overlay} onPress={onClose} />
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnimation }] },
        ]}
      >
        <View style={styles.profileContainer}>
          <View style={styles.details}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                color="#000"
                size={styles.profileImage.height}
              />
            )}

            <View style={styles.profileTextContainer}>
              <Text
                style={styles.profileName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userRole === 'STOREKEEPER' ? storekeeperProfile?.name : name}
              </Text>
              <Text
                style={styles.profileEmail}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userRole === 'STOREKEEPER'
                  ? storekeeperProfile?.storeName
                  : mobile}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              onClose();
              if (role === 'CUSTOMER') {
                safePush('ProfileSetting');
              } else {
                safePush('StorekeeperProfileSetting');
              }
            }}
          >
            <Ionicons
              name="settings-sharp"
              size={24}
              color={Colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.name}
              onPress={() => handleOptionClick(item.name)}
              style={styles.menuItem}
              accessibilityRole="button"
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={Colors.secondary}
                style={styles.menuIconLeft}
              />
              <Text style={styles.menuText}>{item.name}</Text>
              {item.name !== 'Logout' && (
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={Colors.secondaryText}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default SideBar;

const styles = ScaledSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: screenWidth * 0.8,
    backgroundColor: Colors.white,
    paddingTop: '30@vs',
    paddingHorizontal: '20@s',
    zIndex: 1000,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20@vs',
    width: '100%',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  profileImage: {
    width: '60@s',
    height: '60@s',
    borderRadius: '30@s',
  },
  profileTextContainer: {
    maxWidth: screenWidth * 0.55,
    flexShrink: 1,
    paddingHorizontal: '5@s',
  },
  profileName: {
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    color: Colors.secondary,
    flexShrink: 1,
  },
  profileEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
    flexShrink: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '10@vs',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  menuIconLeft: {
    width: '26@s',
    marginRight: '10@s',
  },
  menuText: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
});
