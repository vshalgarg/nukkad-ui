import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  FlatList,
  Text,
  Keyboard,
} from 'react-native';
import { PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import CategoryGridLayout from '../../components/category/CategoriesGridLayout.jsx';
import ProductSlider from '../../components/ProductSlider.jsx';
import SearchContainer from '../../components/SearchContainer.jsx';
import UserToolbar from '../../components/UserToolbar.jsx';
import SideBar from '../../components/sidebar/SideBar';
import styles from '../../styles/globalStyles.js';
import { getAllCategories } from '../../services/customer/categoriesService.js';
import { useSafeRouter } from '../../hooks/useSafeRouter.js';
import { useAddress } from '../../contexts/addressContext.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';
import { useStore } from '../../contexts/storeContext.js';
import { getMyStores } from '../../services/customer/getAllStoreService.js';
import { useAuth } from '../../contexts/authContext.js';
import { getCustomerProfile } from '../../services/customer/profileService.js';
import { useProfile } from '../../contexts/profileContext.js';
import { showToast } from '../../utils/toastUtils.js';
import strings from '../../constants/string.js';

const CustomerDashboard = () => {
  useBackHandlerControl({ confirmBack: true });

  const route = useRoute();
  const { toast } = route.params || {};
  const { createProfile } = useProfile();
  const { safePush } = useSafeRouter();
  const { syncAddressesFromServer, setSelectedAddressId } = useAddress();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { saveStore } = useStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const swipeEnabled = useRef(true);

  useEffect(() => {
    swipeEnabled.current = !sidebarVisible;
  }, [sidebarVisible]);

  useEffect(() => {
    if (toast) {
      try {
        const parsedToast = JSON.parse(toast);
        showToast(parsedToast.type, parsedToast.title);
      } catch (e) {
        console.warn('Failed to parse toast:', e.message);
      }
    }
  }, [toast]);

  useEffect(() => {
    (async () => {
      const savedStoreString = await AsyncStorage.getItem('@selected_store');
      if (savedStoreString) {
        const savedStore = JSON.parse(savedStoreString);
        saveStore(savedStore);
      }
    })();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!swipeEnabled.current) return false;
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50 && swipeEnabled.current) {
          setSidebarVisible(true);
        }
      },
    }),
  ).current;

  // ✅ Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAllCategories();
      if (Array.isArray(response)) {
        setCategories(response);
        await AsyncStorage.setItem('categories', JSON.stringify(response));
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error.message);
    }
  }, []);

  // ✅ Fetch store + profile
  const fetchStoreAndProfile = async () => {
    try {
      const userProfile = await getCustomerProfile(token);
      console.log('customer profile in customerDashboard:', userProfile);

      await createProfile({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        image: userProfile.profileImage || null,
        dob: userProfile.dob || '',
        mobile: userProfile.mobileNumber || '',
      });

      const stores = await getMyStores(token);
      const savedStoreString = await AsyncStorage.getItem('@selected_store');
      const savedStore = savedStoreString ? JSON.parse(savedStoreString) : null;

      if (stores.length === 1) {
        saveStore(stores[0]);
      } else if (
        savedStore &&
        stores.some(s => s.storeId === savedStore.storeId)
      ) {
        saveStore(savedStore);
      } else {
        console.log('Multiple stores found — showing category after load.');
      }

      return stores;
    } catch (err) {
      console.warn('Failed to fetch store/profile:', err.message);
      return [];
    }
  };

  // ✅ Sync address runs *after UI loads* (in background)
  const syncAddressAndSetDefault = async () => {
    try {
      await syncAddressesFromServer();
      const [selected, storedList] = await Promise.all([
        AsyncStorage.getItem('selectedAddressId'),
        AsyncStorage.getItem('address'),
      ]);

      if (selected) {
        setSelectedAddressId(selected);
        return;
      }

      const parsedList = storedList ? JSON.parse(storedList) : [];
      const defaultAddr = parsedList.find(a => a.isDefault);
      const fallbackAddr = defaultAddr || parsedList[0];

      if (fallbackAddr) {
        const addrId = String(fallbackAddr.id);
        setSelectedAddressId(addrId);
        await AsyncStorage.setItem('selectedAddressId', addrId);
      } else {
        setSelectedAddressId(null);
        await AsyncStorage.removeItem('selectedAddressId');
      }
    } catch (err) {
      console.warn('Failed to sync and set default address:', err.message);
    }
  };

  // ✅ Load only categories + stores first, then UI render
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Step 1️⃣: Load cached categories + store instantly (instant UI)
        const [cachedCategories, cachedStore] = await Promise.all([
          AsyncStorage.getItem('categories'),
          AsyncStorage.getItem('@selected_store'),
        ]);

        if (cachedCategories) {
          setCategories(JSON.parse(cachedCategories));
        }
        if (cachedStore) {
          saveStore(JSON.parse(cachedStore));
        }

        // Step 2️⃣: Fetch fresh data (categories + store)
        const [freshCategories, freshStores] = await Promise.all([
          getAllCategories(),
          getMyStores(token),
        ]);

        if (Array.isArray(freshCategories) && freshCategories.length > 0) {
          setCategories(freshCategories);
          await AsyncStorage.setItem(
            'categories',
            JSON.stringify(freshCategories),
          );
        }

        if (Array.isArray(freshStores) && freshStores.length > 0) {
          // If only one store → select automatically
          if (freshStores.length === 1) {
            saveStore(freshStores[0]);
            await AsyncStorage.setItem(
              '@selected_store',
              JSON.stringify(freshStores[0]),
            );
          } else {
            // If multiple stores, don't auto-select, just cache the list
            await AsyncStorage.setItem(
              '@all_stores',
              JSON.stringify(freshStores),
            );
          }
        }

        // Step 3️⃣: Fetch profile + addresses in background (non-blocking)
        getCustomerProfile(token)
          .then(profile => {
            createProfile({
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              email: profile.email || '',
              image: profile.profileImage || null,
              dob: profile.dob || '',
              mobile: profile.mobileNumber || '',
            });
          })
          .catch(err =>
            console.log('Profile fetch (background) failed:', err.message),
          );

        syncAddressAndSetDefault(); // no await
      } catch (err) {
        console.warn('Dashboard init failed:', err.message);
      } finally {
        // Step 4️⃣: Hide loader once category + store ready
        setLoading(false);
      }
    })();
  }, []);

  const handleCategoryPress = category => {
    safePush('ProductPage', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleSearchSubmit = query => {
    if (query.trim()) {
      safePush('ProductPage', { search: query });
    }
  };

  const data = [
    { type: 'search' },
    { type: 'slider' },
    ...(categories.length > 0
      ? [{ type: 'categories', data: categories }]
      : []),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'slider') return <ProductSlider />;
    if (item.type === 'categories')
      return (
        <CategoryGridLayout
          categories={item.data}
          onPressCategory={handleCategoryPress}
        />
      );
    return null;
  };

  return (
    <SafeAreaView style={styles.pageContainer} {...panResponder.panHandlers}>
      <UserToolbar
        onMenuPress={() => {
          Keyboard.dismiss();
          if (!sidebarVisible) setSidebarVisible(true);
        }}
      />
      <View style={{ zIndex: 9, elevation: 10 }}>
        <SearchContainer onSearchSubmit={handleSearchSubmit} />
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10 }}>
            Loading categories and stores...
          </Text>
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={data}
          keyExtractor={(item, index) => item.type + index}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text>{strings.noCategoriesFound}</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <SideBar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </SafeAreaView>
  );
};

export default CustomerDashboard;
