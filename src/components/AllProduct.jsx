import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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

  // Optional sorting
  const sortedList = useMemo(() => {
    return isSorted
      ? [...products].sort((a, b) =>
          (a.name || a.title || '').localeCompare(b.name || b.title || ''),
        )
      : products;
  }, [products, isSorted]);

  // Pair items for grid layout
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
    <View style={styles.pageContainer}>
      <View style={innerStyle.header}>
        <Text style={innerStyle.title}>All Products</Text>
        <View style={innerStyle.filterContainer}>
          <Pressable
            onPress={() => setIsSorted(!isSorted)}
            style={[
              innerStyle.sortButton,
              isSorted
                ? innerStyle.sortButtonActive
                : innerStyle.sortButtonInactive,
            ]}
          >
            <Text
              style={[
                innerStyle.sortText,
                isSorted
                  ? innerStyle.sortTextActive
                  : innerStyle.sortTextInactive,
              ]}
            >
              Sort A-Z
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <Text style={innerStyle.messageText}>Loading...</Text>
      ) : sortedList.length === 0 ? (
        <Text style={innerStyle.messageText}>No products found.</Text>
      ) : (
        <FlatList
          data={pairedList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) =>
            item.map(p => p?.id ?? `null-${index}`).join('-')
          }
          renderItem={({ item: pair }) => (
            <View style={innerStyle.productRow}>
              {pair.map(product => (
                <ProductCard
                  key={product.id}
                  product={JSON.parse(JSON.stringify(product))}
                  // 🔁 clone product to avoid prop mutation issues
                  onAddToCart={handleAddToCart}
                  isDropdownOpen={dropdownOpenId === product.id}
                  setDropdownOpen={open =>
                    setDropdownOpenId(open ? product.id : null)
                  }
                  cartItems={cartItems}
                />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={innerStyle.container}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const innerStyle = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    width: '40%',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
  },
  sortTextInactive: {
    color: Colors.primary,
  },
  sortTextActive: {
    color: Colors.white,
  },
  container: {
    paddingBottom: 80,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  messageText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: Fonts.sizes.base,
  },
});

export default AllProduct;
