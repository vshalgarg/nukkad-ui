import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getAllAddresses,
  addNewAddress,
  updateExistingAddress,
  deleteAddressFromServer,
  markAddressAsDefault,
} from '../services/customer/addressService';

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const [address, setAddress] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [mode, setMode] = useState('add');
  const [addressData, setAddressData] = useState(null);

  // Load from AsyncStorage initially
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('address');
      const storedId = await AsyncStorage.getItem('selectedAddressId');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAddress(parsed);
        const def = parsed.find(a => a.default);
        if (def) setDefaultAddress(def);
      }
      if (storedId) setSelectedAddressId(storedId);
    };
    load();
  }, []);

  // Update AsyncStorage when address changes
  useEffect(() => {
    AsyncStorage.setItem('address', JSON.stringify(address));
    const def = address.find(a => a.default);
    setDefaultAddress(def || null);
  }, [address]);

  // Update AsyncStorage when selected changes
  useEffect(() => {
    if (selectedAddressId)
      AsyncStorage.setItem('selectedAddressId', String(selectedAddressId));
  }, [selectedAddressId]);

  // 🔥 ADD NEW ADDRESS
  const addAddress = async (data) => {
    await addNewAddress(data); // ✅ Save to backend
    await syncAddressesFromServer(); // ✅ Re-sync all addresses
  };

  // 🔥 UPDATE EXISTING ADDRESS
  const updateAddress = async updated => {
    await updateExistingAddress(updated.id, updated); // ✅ Update backend
    await syncAddressesFromServer(); // ✅ Re-fetch list
  };

  // 🔥 DELETE ADDRESS
  const deleteAddress = async (id) => {
    await deleteAddressFromServer(id);
    const filtered = address.filter(a => a.id !== id);
    setAddress(filtered);

    if (String(id) === String(selectedAddressId)) {
      setSelectedAddressId(null);
      await AsyncStorage.removeItem('selectedAddressId');
    }
  };

  // 🔥 MARK DEFAULT
  const markAsDefault = async id => {
    await markAddressAsDefault(id);
    await syncAddressesFromServer(); // ✅ will handle setting default + selected
  };

  // 🔄 SYNC FROM SERVER
  const syncAddressesFromServer = async () => {
    const fresh = await getAllAddresses(); // ✅ fetch from server
    setAddress(fresh);
    await AsyncStorage.setItem('address', JSON.stringify(fresh));

    const def = fresh.find(a => a.default);
    if (def) {
      setDefaultAddress(def);
      setSelectedAddressId(String(def.id));
      await AsyncStorage.setItem('selectedAddressId', String(def.id));
    } else if (fresh.length > 0) {
      setSelectedAddressId(String(fresh[0].id));
      await AsyncStorage.setItem('selectedAddressId', String(fresh[0].id));
    } else {
      setSelectedAddressId(null);
      await AsyncStorage.removeItem('selectedAddressId');
    }
  };

  // CLEAR EVERYTHING
  const resetAddress = async () => {
    setAddress([]);
    setSelectedAddressId(null);
    setDefaultAddress(null);
    await AsyncStorage.removeItem('address');
    await AsyncStorage.removeItem('selectedAddressId');
  };

  return (
    <AddressContext.Provider
      value={{
        address,
        selectedAddressId,
        setSelectedAddressId,
        defaultAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        markAsDefault,
        syncAddressesFromServer,
        resetAddress,
        mode,
        setMode,
        addressData,
        setAddressData,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);
