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
        const parsedStore = JSON.parse(jsonValue);
        setStoreData(parsedStore);
        console.log('Loaded selected store from AsyncStorage:', parsedStore);
      }
    } catch (err) {
      console.error('Failed to load selected store:', err.message);
    }
  };

  // Fetch default store from API
  const fetchDefaultStore = async () => {
    try {
      const defaultStore = await getDefaultStore();
      if (defaultStore) {
        setStoreData(defaultStore);
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(defaultStore));
        console.log('Fetched and saved default store:', defaultStore);
      }
    } catch (err) {
      console.error('Failed to fetch default store:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all stores (kept for backward compatibility)
  const fetchAllStores = async authtoken => {
    try {
      const stores = await getMyStores(authtoken);
      if (Array.isArray(stores)) {
        setAllStores(stores);
        console.log('Fetched all stores:', stores);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save or remove selected store and set as default
  const saveStore = async store => {
    try {
      if (store) {
        // Set as default on backend
        const storeId = store.id || store.storeId || store.storekeeperId;
        await setDefaultStore(storeId);

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
        setStoreData(store);
        console.log(
          'Store saved as default to AsyncStorage and backend:',
          store,
        );
      } else {
        await AsyncStorage.removeItem(STORE_KEY);
        setStoreData(null);
        console.log('Store removed from AsyncStorage');
      }
    } catch (err) {
      console.error('Failed to save selected store:', err.message);
    }
  };

  // Reset selected store
  const resetStore = async () => {
    try {
      await AsyncStorage.removeItem(STORE_KEY);
      setStoreData(null);
    } catch (err) {
      console.error('Failed to reset selected store:', err.message);
    }
  };

  // Initialize StoreProvider - fetch default store only
  useEffect(() => {
    const init = async () => {
      await loadStoreFromStorage();

      // Only fetch default store if token exists and user is CUSTOMER
      if (token && role === 'CUSTOMER') {
        await fetchDefaultStore();
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [token, role]);

  const setStoresList = stores => {
    if (Array.isArray(stores)) setAllStores(stores);
  };

  // Delete a store and update the allStores list
  const removeStore = async (storeId, authtoken) => {
    try {
      //  Delete store from backend
      await deleteStore(storeId, authtoken);

      // Update local state
      setAllStores(prevStores => {
        console.log('Previous Stores:', prevStores, 'Deleting ID:', storeId);

        const updatedStores = prevStores.filter(s => {
          console.log('Comparing IDs:', {
            storeIdField: s.storeId,
            id: s.id,
            storekeeperId: s.storekeeperId,
            deletingId: storeId,
          });

          return s.id?.toString() !== storeId?.toString();
        });

        //  Persist updated list to AsyncStorage
        AsyncStorage.setItem('@all_stores', JSON.stringify(updatedStores));

        //  If deleted store was selected, clear it and fetch new default
        if (
          storeData?.id?.toString() === storeId?.toString() ||
          storeData?.storeId?.toString() === storeId?.toString()
        ) {
          AsyncStorage.removeItem(STORE_KEY);
          setStoreData(null);
          // Fetch new default store
          fetchDefaultStore();
        }

        console.log(' Updated Stores After Deletion:', updatedStores);
        return updatedStores;
      });

      console.log(
        ` Store ${storeId} deleted successfully and context updated.`,
      );
    } catch (err) {
      console.error(' Failed to delete store:', err.message);
      throw err;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        storeData,
        setStoreData,
        saveStore,
        resetStore,
        loadStoreFromStorage,
        allStores,
        setStoresList,
        isLoading,
        fetchAllStores,
        fetchDefaultStore,
        removeStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
