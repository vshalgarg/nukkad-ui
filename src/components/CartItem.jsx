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
import { removeFromCart, updateCartItemQuantity } from '../store/cartSlice';
import {
  updateCartAPI,
  deleteCartItemAPI,
} from '../services/customer/cartService';
import { useAuth } from '../contexts/authContext';

const CartItem = ({
  item,
  openDropdownId,
  setOpenDropdownId,
  onItemRemoved,
}) => {
  const dispatch = useDispatch();
  const { token } = useAuth();
   if (!item || !item.product) {
     console.warn('⛔️ CartItem received undefined item or product', item);
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
      await deleteCartItemAPI(product.id, token);
      dispatch(removeFromCart({ itemId: product.id }));
      if (onItemRemoved) onItemRemoved();
    } catch (err) {
      console.error('❌ Failed to delete item from cart', err);
    }
  };

  const handleUnitSelect = async unit => {
    try {
      await updateCartAPI(product.id, Number(amountInput), unit, token);
      setSelectedUnit(unit); // update local state
      dispatch(
        updateCartItemQuantity({
          itemId: item.itemId,
          selectedUnit: unit,
        }),
      );
      setOpenDropdownId(null);
    } catch (err) {
      console.error('❌ Failed to update unit', err);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const numericValue = parseFloat(amountInput);
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
                itemId: item.itemId,
                amount: numericValue,
              }),
            );
          })
          .catch(() => console.log('❌ Failed to update quantity'));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [amountInput, selectedUnit]); // now watching selectedUnit too

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

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  itemInfoContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-around',
  },
  name: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  unitSelector: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 80,
    height: 42,
  },
  unitText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.secondary,
    marginRight: 6,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    width: 80,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  dropdownItemText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
});
