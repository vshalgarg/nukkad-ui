import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  TouchableOpacity,
  InputAccessoryView,
  Keyboard,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { useDispatch } from 'react-redux';
import {
  removeFromCart,
  updateCartItemQuantity,
  clearProductCartData,
} from '../store/cartSlice';
import {
  updateCartAPI,
  deleteCartItemAPI,
} from '../services/customer/cartService';
import { useAuth } from '../contexts/authContext';
import { ScaledSheet } from 'react-native-size-matters';

const CartItem = ({ item, openDropdownId, setOpenDropdownId }) => {
  const dispatch = useDispatch();
  const { token } = useAuth();

  if (!item || !item.product) {
    console.warn('CartItem received invalid data:', item);
    return null;
  }

  const [showAmountError, setShowAmountError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const placeholderImageUrl = require('../../assets/images/itemNotFound.jpg');
  const { product } = item;
  const originalAmount = useRef(product.amount?.toString() || '');
  const [amountInput, setAmountInput] = useState(
    product.amount?.toString() || '',
  );
  const isDropdownOpen = openDropdownId === product.id;
  const [selectedUnit, setSelectedUnit] = useState(product.selectedUnit);

  const accessoryViewID = `done-${product.id}`;

  const handleDelete = async () => {
    try {
      dispatch(clearProductCartData(product.id));
      await deleteCartItemAPI(product.id, token);
      dispatch(removeFromCart({ itemId: product.id }));
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleUnitSelect = async unit => {
    try {
      await updateCartAPI(product.id, Number(amountInput), unit, token);
      setSelectedUnit(unit);
      dispatch(
        updateCartItemQuantity({
          itemId: item.product.id,
          amount: amountInput,
          selectedUnit: unit,
        }),
      );
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Failed to update unit:', err);
    }
  };

  const handleAmountChange = val => {
    setAmountInput(val);
    if (val.trim() === '' || isNaN(Number(val)) || Number(val) <= 0) {
      setShowAmountError(true);
    } else {
      setShowAmountError(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const numericValue = Number(amountInput);
      if (
        !isNaN(numericValue) &&
        numericValue > 0 &&
        amountInput !== originalAmount.current
      ) {
        updateCartAPI(product.id, numericValue, selectedUnit, token)
          .then(() => {
            originalAmount.current = amountInput;
            dispatch(
              updateCartItemQuantity({
                itemId: item.product.id,
                amount: numericValue,
                selectedUnit,
              }),
            );
          })
          .catch(() => console.log('Failed to update quantity'));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [amountInput, selectedUnit]);

  useEffect(() => {
    setImageError(false);
  }, [product.image]);

  return (
    <View style={styles.cartItem}>
      <Image
        style={styles.image}
        source={
          imageError
            ? placeholderImageUrl
            : { uri: product.image || product.imageUrls?.[0] }
        }
        onError={() => setImageError(true)}
      />

      <View style={styles.itemInfoContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, showAmountError && styles.errorInput]}
            value={amountInput}
            keyboardType="number-pad"
            onChangeText={handleAmountChange}
            placeholder="Qty."
            maxLength={4}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? accessoryViewID : undefined
            }
          />

          <View style={{ marginLeft: 10 }}>
            {product.quantity?.length === 1 ? (
              <View style={styles.unitSelector}>
                <Text style={styles.unitText}>{selectedUnit || 'Unit'}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() =>
                  setOpenDropdownId(isDropdownOpen ? null : product.id)
                }
                style={styles.unitSelector}
              >
                <Text style={styles.unitText}>{selectedUnit || 'Unit'}</Text>
              </Pressable>
            )}

            {isDropdownOpen && (
              <View style={styles.dropdown}>
                {product.quantity?.map((unit, index) => (
                  <Pressable
                    key={`${product.id}-${unit}-${index}`}
                    onPress={() => handleUnitSelect(unit)}
                    style={styles.dropdownItem}
                  >
                    <Text style={styles.dropdownItemText}>{unit}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleDelete}>
        <MaterialIcons
          name="delete-outline"
          size={25}
          color={Colors.secondary}
        />
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryViewID}>
          <View style={styles.accessoryContainer}>
            <TouchableOpacity onPress={Keyboard.dismiss}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
};

export default React.memo(CartItem);

const styles = ScaledSheet.create({
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12@ms',
    borderRadius: '8@ms',
    marginBottom: '10@ms',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  errorInput: {
    borderColor: 'red',
  },
  image: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    resizeMode: 'cover',
  },
  itemInfoContainer: {
    flex: 1,
    marginLeft: '10@ms',
    justifyContent: 'space-around',
  },
  name: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
    marginBottom: '4@ms',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '8@ms',
  },
  input: {
    width: '55@ms',
    height: '38@ms',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '6@ms',
    paddingHorizontal: '8@ms',
    textAlign: 'center',
    fontWeight: '700',
  },
  unitSelector: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '8@ms',
    paddingHorizontal: '7@ms',
    paddingVertical: '8@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '55@ms',
    height: '38@ms',
  },
  unitText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.secondary,
    marginRight: 6,
  },
  dropdown: {
    position: 'absolute',
    top: '40@ms',
    width: '55@ms',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    zIndex: 100,
    elevation: 8,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: '10@ms',
    paddingHorizontal: '12@ms',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  dropdownItemText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.secondary,
    fontWeight: '500',
  },
  accessoryContainer: {
    backgroundColor: Colors.white,
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: Colors.borderColor,
  },
  doneText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
  },
});
