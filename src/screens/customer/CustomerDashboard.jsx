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
import { useStore } from '../../contexts/storeContext.js';
import { getMyStores } from '../../services/customer/getAllStoreService.js';
import { useAuth } from '../../contexts/authContext.js';
import { getCustomerProfile } from '../../services/customer/profileService.js';
import { useProfile } from '../../contexts/profileContext.js';

const CustomerDashboard = () => {
  useBackHandlerControl({ confirmBack: true });
  const route = useRoute();
  const { toastMessage } = route.params || {};
  const { createProfile } = useProfile();
  const { safePush } = useSafeRouter();
  const { syncAddressesFromServer, setSelectedAddressId } = useAddress();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, role } = useAuth();
  const { saveStore, storeData } = useStore();

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
      console.error('❌ Failed to load categories:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStoreAndProfile = async () => {
    try {
      const userProfile = await getCustomerProfile(token);
      const formattedProfile = {
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        image: userProfile.image || null,
        dob: userProfile.dob || '',
      };

      await createProfile(formattedProfile);

      const stores = await getMyStores(token);

      if (stores.length === 1) {
        saveStore(stores[0]);
      } else {
        const exists =
          storeData &&
          stores.some(s => s.storekeeperId === storeData.storekeeperId);
        if (exists) {
          saveStore(storeData);
        } else {
          saveStore(stores[0]);
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch store/profile:', err.message);
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
    fetchCategories();
    syncAddressAndSetDefault();
    fetchStoreAndProfile();
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
