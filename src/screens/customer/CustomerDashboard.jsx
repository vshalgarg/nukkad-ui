import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  FlatList,
  Text,
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
import { useAuth } from '../../contexts/authContext.js';
import { getCustomerProfile } from '../../services/customer/profileService.js';
import { useProfile } from '../../contexts/profileContext.js';
import { showToast } from '../../utils/toastUtils.js';
import strings from '../../constants/string.js';
import { getDefaultStore } from '../../services/customer/addStoreService.js';

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
  const { saveStore, fetchDefaultStore } = useStore();
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
      try {
        const store = await fetchDefaultStore(); 
        if (store) saveStore(store); 
      } catch (err) {
        console.warn('Failed to fetch default store:', err.message);
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAllCategories();
      if (Array.isArray(response)) {
        setCategories(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(response))
            return response;
          return prev; // avoid unnecessary re-render
        });

        await AsyncStorage.setItem('categories', JSON.stringify(response));
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStoreAndProfile = async () => {
    try {
      const userProfile = await getCustomerProfile(token);
      await createProfile({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        image: userProfile.profileImage || null,
        dob: userProfile.dob || '',
        mobile: userProfile.mobileNumber || '',
      });

      const savedStoreString = await AsyncStorage.getItem('@selected_store');
      if (savedStoreString) {
        const savedStore = JSON.parse(savedStoreString);
        saveStore(savedStore);
      }
    } catch (err) {
      console.warn('Failed to fetch profile/store:', err.message);
    }
  };

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

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const cached = await AsyncStorage.getItem('categories');
        if (cached) {
          setCategories(JSON.parse(cached));
        }
        await Promise.allSettled([
          fetchCategories(),
          syncAddressAndSetDefault(),
          fetchStoreAndProfile(),
        ]);
      } catch (err) {
        console.warn('Initialization failed:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCategories]);

  const handleCategoryPress = useCallback(
    category => {
      safePush('ProductPage', {
        categoryId: category.id,
        categoryName: category.name,
      });
    },
    [safePush],
  );

  const handleSearchSubmit = useCallback(
    query => {
      if (query.trim()) {
        safePush('ProductPage', { search: query });
      }
    },
    [safePush],
  );

  const data = useMemo(
    () => [
      { type: 'search' },
      { type: 'slider' },
      ...(categories.length > 0
        ? [{ type: 'categories', data: categories }]
        : []),
    ],
    [categories],
  );

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === 'slider') return <ProductSlider />;
      if (item.type === 'categories')
        return (
          <CategoryGridLayout
            categories={item.data}
            onPressCategory={handleCategoryPress}
          />
        );
      return null;
    },
    [handleCategoryPress],
  );

  return (
    <SafeAreaView style={styles.pageContainer} {...panResponder.panHandlers}>
      <UserToolbar
        onMenuPress={() => {
          if (!sidebarVisible) setSidebarVisible(true);
        }}
      />
      <View
        style={{ zIndex: 10, elevation: 10 }}
        pointerEvents={sidebarVisible ? 'none' : 'auto'}
      >
        <SearchContainer onSearchSubmit={handleSearchSubmit} />
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#000" />
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
