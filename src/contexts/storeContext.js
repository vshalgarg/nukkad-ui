import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StoreContext = createContext();
const STORE_KEY = '@selected_store';

export const StoreProvider = ({ children }) => {
  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ New loading state

  useEffect(() => {
    loadStoreFromStorage();
  }, []);

  const loadStoreFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORE_KEY);
      if (jsonValue) {
        const parsedStore = JSON.parse(jsonValue);
        setStoreData(parsedStore);
        console.log('✅ Loaded selected store from AsyncStorage:', parsedStore);
      }
    } catch (err) {
      console.error('❌ Failed to load selected store:', err.message);
    } finally {
      setIsLoading(false); // ✅ Done loading
    }
  };

  const saveStore = async store => {
    try {
      if (store) {
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
        setStoreData(store);
        console.log('✅ Store saved to AsyncStorage',store);
      } else {
        await AsyncStorage.removeItem(STORE_KEY);
        setStoreData(null);
        console.log('🗑️ Store removed from AsyncStorage');
      }
    } catch (err) {
      console.error('❌ Failed to save selected store:', err.message);
    }
  };

  const resetStore = async () => {
    try {
      await AsyncStorage.removeItem(STORE_KEY);
      setStoreData(null);
    } catch (err) {
      console.error('❌ Failed to reset selected store:', err.message);
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
        isLoading, // ✅ Expose loading
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
