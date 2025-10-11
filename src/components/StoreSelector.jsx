// components/StoreSelector.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';

const StoreSelector = ({
  stores,
  selectedStore,
  onSelectStore,
  placeholder = 'Select a store',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = store => {
    onSelectStore(store);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleDropdown}>
        <Text
          style={[styles.selectedText, !selectedStore && styles.placeholder]}
        >
          {selectedStore ? selectedStore.storeName : placeholder}
        </Text>
        <Entypo
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.secondaryText}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          <FlatList
            data={stores}
            keyExtractor={item => item.storeId || item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item.storeName}</Text>
                {/* <Text style={styles.optionId}>{item.storeId}</Text> */}
              </TouchableOpacity>
            )}
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12@s',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '8@s',
    backgroundColor: Colors.white,
  },
  selectedText: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
  placeholder: {
    color: Colors.secondaryText,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200@vs',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '8@s',
    backgroundColor: Colors.white,
    marginTop: '5@vs',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  option: {
    padding: '12@s',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  optionText: {
    fontSize: Fonts.sizes.base,
    // fontWeight: '500',
    color: Colors.secondary,
  },
  optionId: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
    marginTop: '2@vs',
  },
});

export default StoreSelector;
