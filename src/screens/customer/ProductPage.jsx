import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';

import AllProduct from '../../components/AllProduct.jsx';
import SearchContainer from '../../components/SearchContainer.jsx';
import UserToolbar from '../../components/UserToolbar.jsx';
import CategoryListLayout from '../../components/category/CategoriesListLayout.jsx';
import { searchProducts } from '../../services/customer/searchService.js';
import { getProductsByCategory } from '../../services/customer/getProductsByCategorySerivce.js';

import Colors from '../../styles/colors.js';
import styles from '../../styles/globalStyles.js';
import { useSafeRouter } from '../../hooks/useSafeRouter.js';
import Fonts from '../../styles/font.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';

const ProductPage = () => {
  useBackHandlerControl({ confirmBack: false });

  const route = useRoute();
  const { safePush } = useSafeRouter();

  const search = route?.params?.search || '';
  const categoryId = route?.params?.categoryId;
  const categoryName = route?.params?.categoryName;

  const [searchQuery, setSearchQuery] = useState(search);
  const [groupedResults, setGroupedResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const cartItems = useSelector(state => state.cart.items);
  const totalItems = cartItems.reduce((total, item) => {
    const isPacket = item.product.selectedUnit?.toLowerCase() === 'pkt';
    return total + (isPacket ? parseInt(item.product.amount) || 0 : 1);
  }, 0);

  useFocusEffect(
    useCallback(() => {
      // Only fetch if categoryId exists
      if (categoryId) {
        (async () => {
          setSearching(true);
          try {
            const items = await getProductsByCategory(categoryId);
            setGroupedResults([
              {
                id: categoryId,
                name: categoryName || 'Category',
                items,
              },
            ]);
          } catch (err) {
            console.error('❌ Focus-fetch failed:', err.message);
            setGroupedResults([]);
          } finally {
            setSearching(false);
          }
        })();
      }
    }, [categoryId]),
  );

  useEffect(() => {
    if (search && !categoryId) {
      setSearchQuery(search);
      handleSearch(search);
    }
  }, [search, categoryId]);

  const handleSearch = async keyword => {
    const trimmed = keyword.trim();
    setSearchQuery(trimmed);

    if (!trimmed) {
      if (categoryId) {
        // Re-fetch category products if category exists
        setSearching(true);
        try {
          const items = await getProductsByCategory(categoryId);
          setGroupedResults([
            {
              id: categoryId,
              name: categoryName || 'Category',
              items,
            },
          ]);
        } catch (err) {
          console.error('❌ Category fetch failed (on clear):', err.message);
          setGroupedResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        // No category or query — just clear results
        setGroupedResults([]);
      }
      return;
    }

    // Normal search flow
    setSearching(true);
    try {
      const result = await searchProducts(trimmed);
      const items = result?.items || [];
      setGroupedResults([{ id: 'search', items }]);
    } catch (err) {
      console.error('❌ Search failed:', err.message);
      setGroupedResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={[styles.pageContainer, { flex: 1, backgroundColor: 'white' }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <UserToolbar hideNotification={true} hideMenu={true} />
          <FlatList
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item, index) => item.id}
            ListHeaderComponent={
              <View>
                <SearchContainer
                  query={searchQuery}
                  onSearchSubmit={newQuery => {
                    setSearchQuery(newQuery);
                    handleSearch(newQuery);
                  }}
                />

                {groupedResults.map(category => (
                  <View
                    key={category.id}
                    style={{ marginVertical: 10, paddingHorizontal: 10 }}
                  >
                    <AllProduct products={category.items} />
                  </View>
                ))}

                {!searching && groupedResults.length === 0 && (
                  <Text
                    style={{
                      textAlign: 'center',
                      marginTop: 40,
                      color: Colors.secondaryText,
                    }}
                  >
                    No items found.
                  </Text>
                )}
              </View>
            }
            ListFooterComponent={<View style={{ height: 50 }} />}
          />
        </View>
      </TouchableWithoutFeedback>

      {totalItems > 0 && !keyboardVisible && (
        <View style={innerStyle.fixedBottomBanner}>
          <Text style={innerStyle.popupText}>
            {totalItems} item{totalItems > 1 ? 's' : ''} in cart
          </Text>
          <TouchableOpacity
            style={innerStyle.goToCartButton}
            onPress={() => safePush('ShoppingCart')}
          >
            <Text style={innerStyle.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const innerStyle = StyleSheet.create({
  fixedBottomBanner: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    zIndex: 999,
  },
  popupText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
  },
  goToCartButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
  },
  goToCartText: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
});

export default ProductPage;
