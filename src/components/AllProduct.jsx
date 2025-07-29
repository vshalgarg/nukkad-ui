import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import styles from '../styles/globalStyles';
import ProductCard from './ProductCard';
import Fonts from '../styles/font.js';
import Colors from '../styles/colors.js';

const AllProduct = ({ products = [], loading = false }) => {
  const dispatch = useDispatch();
  const [isSorted, setIsSorted] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const cartItems = useSelector(state => state.cart.items);

  const sortedList = isSorted
    ? [...products].sort((a, b) =>
      (a.name || a.title || '').localeCompare(b.name || b.title || ''),
    )
    : products;

  const pairedList = useMemo(() => {
    const result = [];
    for (let i = 0; i < sortedList.length; i += 2) {
      const pair = [sortedList[i]];
      if (i + 1 < sortedList.length) {
        pair.push(sortedList[i + 1]);
      }
      result.push(pair);
    }
    return result;
  }, [sortedList]);

  const handleAddToCart = (productWithDetails, cartQuantity) => {
    dispatch(
      addToCart({
        product: {
          ...productWithDetails,
          selectedUnit: productWithDetails.selectedUnit,
          amount: productWithDetails.amount,
        },
        cartQuantity,
      }),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {loading && products.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : sortedList.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No products found.
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 }}>
          {sortedList.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              isDropdownOpen={dropdownOpenId === product.id}
              setDropdownOpen={open => setDropdownOpenId(open ? product.id : null)}
              cartItems={cartItems}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default AllProduct;

