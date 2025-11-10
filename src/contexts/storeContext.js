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

  const fetchDefaultStore = async () => {
    try {
      const defaultStore = await getDefaultStore();
      if (defaultStore) {
        setStoreData(defaultStore);
        console.log('defaultStore', defaultStore);
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(defaultStore));
        console.log('Fetched and saved default store:', defaultStore);
      }
    } catch (err) {
      console.error('Failed to fetch default store:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  const saveStore = async store => {
    try {
      if (store) {
        const storeId = store.id || store.storeId || store.storekeeperId;
        await setDefaultStore(storeId);
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

  const resetStore = async () => {
    try {
      await AsyncStorage.removeItem(STORE_KEY);
      setStoreData(null);
    } catch (err) {
      console.error('Failed to reset selected store:', err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadStoreFromStorage();
      if (token && role === 'CUSTOMER') {
        await fetchDefaultStore();
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const setStoresList = stores => {
    if (Array.isArray(stores)) setAllStores(stores);
  };
  const removeStore = async (storeId, authtoken) => {
    try {
      await deleteStore(storeId, authtoken);
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
        AsyncStorage.setItem('@all_stores', JSON.stringify(updatedStores));
        if (
          storeData?.id?.toString() === storeId?.toString() ||
          storeData?.storeId?.toString() === storeId?.toString()
        ) {
          AsyncStorage.removeItem(STORE_KEY);
          setStoreData(null);
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
