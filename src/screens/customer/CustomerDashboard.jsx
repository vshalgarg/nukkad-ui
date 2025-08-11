import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  FlatList,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import CategoryGridLayout from '../../components/category/CategoriesGridLayout.jsx';
import ProductSlider from '../../components/ProductSlider.jsx';
import SearchContainer from '../../components/SearchContainer.jsx';
import UserToolbar from '../../components/UserToolbar.jsx';
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
  const { params } = route.params || {};
  const { store, toast } = route.params || {};
  console.log('store:', store);
  console.log('toast:', toast);

  console.log('params', params);
  const { createProfile } = useProfile();

  useEffect(() => {
    if (toast) {
      try {
        const parsedToast = JSON.parse(toast);
        showToast(parsedToast.type, parsedToast.title);
      } catch (e) {
        console.warn(' Failed to parse toast:', e.message);
      }
    }
    if (params?.storeData) {
      saveStore(params?.storeData);
    }
  }, []);

  const { safePush } = useSafeRouter();
  const { syncAddressesFromServer, setSelectedAddressId } = useAddress();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { saveStore } = useStore();

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
        image: userProfile.image || null,
        dob: userProfile.dob || '',
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
      }
    } catch (err) {
      console.warn('Failed to fetch store/profile:', err.message);
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
      console.warn(' Failed to sync and set default address:', err.message);
    }
  };

  useEffect(() => {

    (async () => {
      const cached = await AsyncStorage.getItem('categories');
      if (cached) {
        setCategories(JSON.parse(cached));
        setLoading(false); 
      }
    })();

    Promise.allSettled([
      fetchCategories(), // refresh categories
      syncAddressAndSetDefault(), // sync address
      fetchStoreAndProfile(), // profile & store
    ]).catch(err => {
      console.warn('Parallel fetch failed:', err.message);
    });
  }, [fetchCategories]);

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
    if (item.type === 'search') {
      return <SearchContainer onSearchSubmit={handleSearchSubmit} />;
    }
    if (item.type === 'slider') {
      return <ProductSlider />;
    }
    if (item.type === 'categories') {
      return (
        <CategoryGridLayout
          categories={item.data}
          onPressCategory={handleCategoryPress}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <UserToolbar />
      {loading && categories.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator
            size="large"
            color="#000"
            style={{ marginTop: 20 }}
          />
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
        />
      )}
    </SafeAreaView>
  );
};

export default React.memo(CustomerDashboard);
