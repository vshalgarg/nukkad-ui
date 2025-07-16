// screens/customer/CustomerDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const { safePush } = useSafeRouter();
  const { syncAddressesFromServer, setSelectedAddressId } = useAddress();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const cached = await AsyncStorage.getItem('categories');
      if (cached) {
        setCategories(JSON.parse(cached));
        setLoading(false);
        return; 
      }

      const response = await getAllCategories();
      setCategories(response);
      await AsyncStorage.setItem('categories', JSON.stringify(response));
    } catch (error) {
      console.error('❌ Failed to load categories:', error.message);
    } finally {
      setLoading(false);
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
      if (defaultAddr) {
        setSelectedAddressId(String(defaultAddr.id));
        await AsyncStorage.setItem('selectedAddressId', String(defaultAddr.id));
      } else if (parsedList.length > 0) {
        const fallback = parsedList[0];
        setSelectedAddressId(String(fallback.id));
        await AsyncStorage.setItem('selectedAddressId', String(fallback.id));
      } else {
        setSelectedAddressId(null);
        await AsyncStorage.removeItem('selectedAddressId');
      }
    } catch (err) {
      console.warn('⚠️ Failed to sync and set default address:', err.message);
    }
  };

  useEffect(() => {
    // ✅ Fetch categories immediately
    fetchCategories();

    // ✅ Defer heavy logic until after first render frame
    const task = InteractionManager.runAfterInteractions(() => {
      syncAddressAndSetDefault();
    });

    return () => task.cancel();
  }, []);

  const handleCategoryPress = category => {
    console.log('Clicked:', category.name);
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

  return (
    <View style={[styles.pageContainer]}>
      <UserToolbar />
      <SearchContainer onSearchSubmit={handleSearchSubmit} />
      <ProductSlider />

      <SafeAreaView>
        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <CategoryGridLayout
            categories={categories}
            onPressCategory={handleCategoryPress}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default CustomerDashboard;
