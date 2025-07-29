import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getStorekeeperProfile,
  createStorekeeperProfile as createProfileAPI,
  UpdateStorekeeperProfile as updateProfileAPI
} from '../services/storekeeper/storekeeperProfileService';

const StorekeeperProfileContext = createContext();

export const StorekeeperProfileProvider = ({ children }) => {
  const [storekeeperProfile, setStorekeeperProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Optional: helpful in screens

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const savedProfile = await AsyncStorage.getItem('storekeeperProfile');
  //       if (savedProfile) {
  //         const parsed = JSON.parse(savedProfile);
  //         setStorekeeperProfile(parsed);
  //       } else {
  //         // ⬇️ Try loading from API if local not found
  //         const token = await AsyncStorage.getItem('authToken'); // or get from authContext
  //         if (token) {
  //           const remoteProfile = await getStorekeeperProfile(token);
  //           setStorekeeperProfile(remoteProfile);
  //           await AsyncStorage.setItem('storekeeperProfile', JSON.stringify(remoteProfile));
  //         }
  //       }
  //     } catch (err) {
  //       console.log('❌ Failed to load storekeeper profile:', err);
  //     }
  //   })();
  // }, []);

  const resetStorekeeperProfile = async () => {
    setStorekeeperProfile(null);
    await AsyncStorage.removeItem('storekeeperProfile');
  };

  // ✅ USE THIS to fetch profile for existing users
  const fetchStorekeeperProfile = async (token) => {
    try {
      const data = await getStorekeeperProfile(token);
      setStorekeeperProfile(data);
      await AsyncStorage.setItem('storekeeperProfile', JSON.stringify(data));
    } catch (err) {
      console.error('❌ Failed to fetch storekeeper profile:', err);
      throw err;
    }
  };

  // ✅ USE THIS to create profile (new users)
  const createStorekeeperProfile = async (fields, token) => {
    try {
      const apiData = await createProfileAPI(fields, token);
      setStorekeeperProfile(apiData);
      await AsyncStorage.setItem('storekeeperProfile', JSON.stringify(apiData));
    } catch (err) {
      console.error('❌ Failed to create storekeeper profile:', err);
      throw err;
    }
  };

  // ✅ USE THIS to update profile
  const updateStorekeeperProfile = async (fields, token) => {
    if (!storekeeperProfile) throw new Error('Storekeeper profile not found');
    console.log("fields to update",fields)

    try {
      await updateProfileAPI(fields, token);
      const updatedProfile = { ...storekeeperProfile, ...fields };
      setStorekeeperProfile(updatedProfile);
      await AsyncStorage.setItem('storekeeperProfile', JSON.stringify(updatedProfile));
    } catch (err) {
      console.error('❌ Failed to update storekeeper profile:', err);
      throw err;
    }
  };

  return (
    <StorekeeperProfileContext.Provider
      value={{
        storekeeperProfile,
        loading,
        createStorekeeperProfile,
        fetchStorekeeperProfile,
        updateStorekeeperProfile,
        resetStorekeeperProfile,
      }}
    >
      {children}
    </StorekeeperProfileContext.Provider>
  );
};

export const useStorekeeperProfile = () => useContext(StorekeeperProfileContext);
