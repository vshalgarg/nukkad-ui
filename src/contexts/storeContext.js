import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './authContext';
import {
  getDefaultStore,
  setDefaultStore,
} from '../services/customer/addStoreService';
import {
  deleteStore,
  getMyStores,
} from '../services/customer/getAllStoreService';

const StoreContext = createContext();
const STORE_KEY = '@selected_store';
const ALL_STORES_KEY = '@all_stores';

export const StoreProvider = ({ children }) => {
  const { token, role } = useAuth();
  const [storeData, setStoreData] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected store from AsyncStorage
  const loadStoreFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORE_KEY);
      if (jsonValue) {
        setStoreData(JSON.parse(jsonValue));
      }
    } catch (err) {
      console.error('Failed to load selected store:', err.message);
    }
  };

  const fetchAllStores = async () => {
    setIsLoading(true);
    try {
      let stores = [];
      if (token && role === 'CUSTOMER') {
        stores = await getMyStores(token);
      }
      if (!Array.isArray(stores)) stores = [];
      setAllStores(stores);
      await AsyncStorage.setItem(ALL_STORES_KEY, JSON.stringify(stores));
      return stores; // <-- add this
    } catch (err) {
      console.error('Failed to fetch stores:', err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultStore = async () => {
    if (!token || role !== 'CUSTOMER') return;
    try {
      const defaultStore = await getDefaultStore().catch(() => null);
      if (defaultStore) {
        setStoreData(defaultStore);
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(defaultStore));
      }
    } catch (err) {
      console.error('Failed to fetch default store:', err.message);
    }
  };

  const saveStore = async store => {
    try {
      if (store) {
        const storeId = store.id || store.storekeeperId;
        if (storeId) {
          await setDefaultStore(storeId);
          await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
          setStoreData(store);
        }
      } else {
        await AsyncStorage.removeItem(STORE_KEY);
        setStoreData(null);
      }
    } catch (err) {
      console.error('Failed to save selected store:', err.message);
    }
  };

  const removeStore = async storeId => {
    try {
      if (!storeId || !token) return;

      await deleteStore(storeId, token);

      setAllStores(prev => {
        const updated = prev.filter(
          s =>
            s.id?.toString() !== storeId?.toString() &&
            s.storekeeperId?.toString() !== storeId?.toString() &&
            s.storeId?.toString() !== storeId?.toString(),
        );

        AsyncStorage.setItem(ALL_STORES_KEY, JSON.stringify(updated));

        if (
          storeData &&
          [storeData.id, storeData.storekeeperId, storeData.storeId].some(
            id => id?.toString() === storeId?.toString(),
          )
        ) {
          AsyncStorage.removeItem(STORE_KEY);
          setStoreData(null);
          fetchDefaultStore();
        }

        return updated;
      });
    } catch (err) {
      console.error('Failed to delete store:', err.message);
      throw err;
    }
  };

  // Reset selected store
  const resetStore = async () => {
    try {
      await AsyncStorage.removeItem(STORE_KEY);
      setStoreData(null);
    } catch (err) {
      console.error('Failed to reset store:', err.message);
    }
  };

  // Initialize context on mount
  useEffect(() => {
    const init = async () => {
      await loadStoreFromStorage();
      await fetchAllStores();
      await fetchDefaultStore();
      setIsLoading(false);
    };
    init();
  }, [token]);

  return (
    <StoreContext.Provider
      value={{
        storeData,
        allStores,
        saveStore,
        resetStore,
        fetchAllStores,
        fetchDefaultStore,
        removeStore,
        isLoading,
        setStoresList: setAllStores,
        setStoreData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
