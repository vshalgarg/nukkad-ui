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

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('address');
      const storedId = await AsyncStorage.getItem('selectedAddressId');
      console.log(typeof storedId);
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

  useEffect(() => {
    AsyncStorage.setItem('address', JSON.stringify(address));
    const def = address.find(a => a.default);
    setDefaultAddress(def || null);
  }, [address]);

  useEffect(() => {
    if (selectedAddressId)
      AsyncStorage.setItem('selectedAddressId', String(selectedAddressId));
  }, [selectedAddressId]);

  const addAddress = async data => {
    const tempId = `temp-${Date.now()}`;
    const optimisticAddress = {
      ...data,
      id: tempId,
      default: address.length === 0,
    };

    setAddress(prev => [...prev, optimisticAddress]);
    setSelectedAddressId(tempId);

    try {
      const res = await addNewAddress(data);

      setAddress(prev =>
        prev.map(a => (a.id === tempId ? { ...a, id: res.id } : a)),
      );

      setSelectedAddressId(res.id);
      await AsyncStorage.setItem('selectedAddressId', String(res.id));

      await syncAddressesFromServer();
    } catch (err) {
      console.error('Failed to add address:', err);
      setAddress(prev => prev.filter(a => a.id !== tempId)); 
    }
  };

  const updateAddress = async updated => {
    setAddress(prev =>
      prev.map(a => (a.id === updated.id ? { ...a, ...updated } : a)),
    );
  
    try {
      const res = await updateExistingAddress(updated.id, updated);
      setSelectedAddressId(res.id);
      await AsyncStorage.setItem('selectedAddressId', String(res.id));
      await syncAddressesFromServer(); 
    } catch (err) {
      console.error('Failed to update address:', err);
    }
  };

  const deleteAddress = async id => {
    await deleteAddressFromServer(id);
    const filtered = address.filter(a => a.id !== id);
    setAddress(filtered);

    if (String(id) === String(selectedAddressId)) {
      setSelectedAddressId(null);
      await AsyncStorage.removeItem('selectedAddressId');
    }
  };
  const markAsDefault = async id => {
    await markAddressAsDefault(id);
    await syncAddressesFromServer(); 
  };

  const syncAddressesFromServer = async () => {
    const fresh = await getAllAddresses(); 
    setAddress(fresh);
    await AsyncStorage.setItem('address', JSON.stringify(fresh));
  };

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
