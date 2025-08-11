// components/CartItem.jsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
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

const CartItem = ({
  item,
  openDropdownId,
  setOpenDropdownId,
  onItemRemoved,
}) => {
  const dispatch = useDispatch();
  const { token } = useAuth();
  if (!item || !item.product) {
    console.warn(' CartItem received undefined item or product', item);
    return null;
  }
  const [imageError, setImageError] = useState(false);
  const placeholderImageUrl = require('../../assets/images/itemNotFound.jpg');
  const { product } = item;
  const originalAmount = useRef(product.amount?.toString() || '');
  const [amountInput, setAmountInput] = useState(
    product.amount?.toString() || '',
  );
  const isDropdownOpen = openDropdownId === product.id;
  const [selectedUnit, setSelectedUnit] = useState(product.selectedUnit);

  const handleDelete = async () => {
    try {
      dispatch(clearProductCartData(product.id));
      await deleteCartItemAPI(product.id, token);
      dispatch(removeFromCart({ itemId: product.id }));
      if (onItemRemoved) onItemRemoved();
    } catch (err) {
      console.error(' Failed to delete item from cart', err);
    }
  };

  const handleUnitSelect = async unit => {
    try {
      await updateCartAPI(product.id, Number(amountInput), unit, token);
      setSelectedUnit(unit); // update local state
      dispatch(
        updateCartItemQuantity({
          itemId: item.product.id,
          amount: amountInput,
          selectedUnit: unit,
        }),
      );
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Failed to update unit', err);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const numericValue = amountInput;
      if (
        !isNaN(numericValue) &&
        numericValue >= 0 &&
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
            style={styles.input}
            value={amountInput}
            keyboardType="numeric"
            onChangeText={setAmountInput}
            placeholder=""
            maxLength={3}
          />
          <View style={{ marginLeft: 10 }}>
            <Pressable
              onPress={() =>
                setOpenDropdownId(isDropdownOpen ? null : product.id)
              }
              style={styles.unitSelector}
            >
              <Text style={styles.unitText}>{selectedUnit || 'Unit'}</Text>

              <AntDesign name={isDropdownOpen ? 'up' : 'down'} size={14} />
            </Pressable>

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
    </View>
  );
};

export default CartItem;

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
    width: '45@ms',
    height: '38@ms',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '6@ms',
    paddingHorizontal: '8@ms',
    textAlign: 'center',
    fontWeight: '800',
  },
  unitSelector: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '8@ms',
    paddingHorizontal: '10@ms',
    paddingVertical: '8@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70@ms',
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
    width: '70@ms',
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
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
});
