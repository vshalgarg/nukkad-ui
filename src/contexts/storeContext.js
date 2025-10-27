import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMyStores,
  deleteStore,
} from '../services/customer/getAllStoreService';
import { useAuth } from './authContext';

const StoreContext = createContext();
const STORE_KEY = '@selected_store';

export const StoreProvider = ({ children }) => {
  const { token, role } = useAuth(); // get auth info from AuthContext
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

  // Fetch stores from API
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

  // Save or remove selected store
  const saveStore = async store => {
    try {
      if (store) {
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
        setStoreData(store);
        console.log('Store saved to AsyncStorage', store);
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

  // Initialize StoreProvider
  useEffect(() => {
    const init = async () => {
      await loadStoreFromStorage();

      // Only fetch stores if token exists and user is CUSTOMER
      if (token && role === 'CUSTOMER') {
        await fetchAllStores(token);
      } else {
        setIsLoading(false); // no token, stop loading
      }
    };

    init();
  }, [token, role]); // <-- listen to token & role changes

  const setStoresList = stores => {
    if (Array.isArray(stores)) setAllStores(stores);
  };

  // Delete a store and update the allStores list
  const removeStore = async (storeId, authtoken) => {
    try {
      // 1️⃣ Delete store from backend
      await deleteStore(storeId, authtoken);

      // 2️⃣ Update local state
      setAllStores(prevStores => {
        console.log('🗂️ Previous Stores:', prevStores, 'Deleting ID:', storeId);

        const updatedStores = prevStores.filter(s => {
          console.log('🔍 Comparing IDs:', {
            storeIdField: s.storeId,
            id: s.id,
            storekeeperId: s.storekeeperId,
            deletingId: storeId,
          });

          // ✅ Always compare as strings
          return s.id?.toString() !== storeId?.toString();
        });

        // 3️⃣ Persist updated list to AsyncStorage
        AsyncStorage.setItem('@all_stores', JSON.stringify(updatedStores));

        // 4️⃣ If deleted store was selected, clear it
        if (
          storeData?.id?.toString() === storeId?.toString() ||
          storeData?.storeId?.toString() === storeId?.toString()
        ) {
          AsyncStorage.removeItem(STORE_KEY);
          setStoreData(null);
        }

        console.log('🟢 Updated Stores After Deletion:', updatedStores);
        return updatedStores; // must return new list
      });

      console.log(
        `✅ Store ${storeId} deleted successfully and context updated.`,
      );
    } catch (err) {
      console.error('❌ Failed to delete store:', err.message);
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
        removeStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
