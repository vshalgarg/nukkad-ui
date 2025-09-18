import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ProductCard from './ProductCard';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

const { height } = Dimensions.get('screen');

const AllProduct = ({ products = [], loading = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [isSorted, setIsSorted] = useState(false);

  const sortedList = useMemo(() => {
    return isSorted
      ? [...products].sort((a, b) =>
          (a.name || a.title || '').localeCompare(b.name || b.title || ''),
        )
      : products;
  }, [products, isSorted]);

  if (loading && products.length === 0) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }

  if (!loading && sortedList.length === 0) {
    return (
      <View style={innerStyle.emptyContainer}>
        <Text style={innerStyle.emptyText}>
          No products found. Try searching for something else
        </Text>
      </View>
    );
  }

  const rows = [];
  for (let i = 0; i < sortedList.length; i += 2) {
    rows.push(sortedList.slice(i, i + 2));
  }

  return (
    // <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    //   <KeyboardAvoidingView
    //   style={{ flex: 1 }}
    //   behavior={Platform.OS=== 'ios' ? 'padding' : 'height'}
    //   keyboardVerticalOffset={Platform.OS === 'ios' ? 130 : 0}
    // >

    // <ScrollView
    //   contentContainerStyle={[innerStyle.productsContainer,{ flexGrow: 1 }]}
    //   keyboardShouldPersistTaps="always"
    // >
    <View style={innerStyle.productsContainer}>
      {rows.map((rowItems, rowIndex) => (
        <View key={rowIndex} style={innerStyle.row}>
          {rowItems.map(item => {
            const inputAccessoryViewID = `uniqueId-${item.id}`;

            return (
              <ProductCard
                key={item.id.toString()}
                product={item}
                isDropdownOpen={dropdownOpenId === item.id}
                setDropdownOpen={open =>
                  setDropdownOpenId(open ? item.id : null)
                }
                cartItems={cartItems}
                style={{ flex: 1, marginHorizontal: 5 }}
                inputAccessoryViewID={inputAccessoryViewID}
              />
            );
          })}
          {rowItems.length === 1 && (
            <View style={{ flex: 1, marginHorizontal: 5 }} />
          )}
        </View>
      ))}
    </View>

    /*  </ScrollView>

    </KeyboardAvoidingView>
    </TouchableWithoutFeedback> */
  );
};

export default AllProduct;

const innerStyle = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: height - height * 0.4,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: Fonts.sizes.base,
  },
  productsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    zIndex: 1,
  },
});
