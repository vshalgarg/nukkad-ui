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
import Toast from 'react-native-toast-message';

import CategoryGridLayout from '../../components/category/CategoriesGridLayout.jsx';
import ProductSlider from '../../components/ProductSlider.jsx';
import SearchContainer from '../../components/SearchContainer.jsx';
import UserToolbar from '../../components/UserToolbar.jsx';

import styles from '../../styles/globalStyles.js';
import { getAllCategories } from '../../services/customer/categoriesService.js';
import { useSafeRouter } from '../../hooks/useSafeRouter.js';
import { useAddress } from '../../contexts/addressContext.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';

const CustomerDashboard = () => {
  useBackHandlerControl({ confirmBack: true });
  const route = useRoute();
  const { toastMessage } = route.params || {};

  const { safePush } = useSafeRouter();
  const { syncAddressesFromServer, setSelectedAddressId } = useAddress();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = await AsyncStorage.getItem('categories');
        if (cached) {
          setCategories(JSON.parse(cached));
          setLoading(false);
          return;
        }
      }

      const response = await getAllCategories();
      if (Array.isArray(response)) {
        setCategories(response);
        await AsyncStorage.setItem('categories', JSON.stringify(response));
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Failed to load categories:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      console.warn('⚠️ Failed to sync and set default address:', err.message);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: toastMessage,
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  }, [toastMessage]);
  useEffect(() => {
    fetchCategories(); // Load cache first
    syncAddressAndSetDefault();
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

  // 👇 FlatList Data Items
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
      {loading ? (
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
          data={data}
          keyExtractor={(item, index) => item.type + index}
          renderItem={renderItem}
         
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text>No categories found</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      <Toast />
    </SafeAreaView>
  );
};

export default React.memo(CustomerDashboard);
