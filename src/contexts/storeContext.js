import { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StoreContext = createContext();

const STORE_KEY = '@selected_store';

export const StoreProvider = ({ children }) => {
  const [storeData, setStoreData] = useState(null);

  // 🔄 Expose this to manually load from AsyncStorage
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
    }
  };

  const saveStore = async store => {
    try {
      if (store) {
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
        setStoreData(store);
        console.log('✅ Store saved to AsyncStorage');
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
    } catch (err) {
      console.error('❌ Failed to reset selected store:', err.message);
    }
    setStoreData(null);
  };

  return (
    <StoreContext.Provider
      value={{
        storeData,
        setStoreData,
        saveStore,
        resetStore,
        loadStoreFromStorage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
